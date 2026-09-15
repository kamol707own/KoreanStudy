import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, parseBearer, verifyUser } from '@/lib/supabase/server'
import { ADMIN_EMAIL, priceForMonth, type AccessState } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface OrderRow {
  id: string
  plan_month: number
  status: string
  amount: number
  coupon_discount: number | null
  created_at: string
  expires_at: string | null
}

/**
 * Current subscription state for the signed-in user: whether they have
 * access, when it expires, what the next month costs, and any pending order.
 */
export async function GET(req: NextRequest) {
  const client = getAdminClient()
  const user = await verifyUser(parseBearer(req.headers.get('authorization')))
  if (!client) return NextResponse.json({ error: 'not_configured' }, { status: 500 })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await client
    .from('orders')
    .select('id, plan_month, status, amount, coupon_discount, created_at, expires_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[access] failed:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  const rows = (data ?? []) as unknown as OrderRow[]
  const isAdmin = (user.email ?? '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
  const approved = rows.filter(r => r.status === 'approved')
  const active = approved.find(r => r.expires_at && new Date(r.expires_at) > new Date())
  const pending = rows.find(r => r.status === 'pending')
  const planMonth = approved.length + 1

  const state: AccessState = {
    // Admins always have access; they don't need to subscribe.
    hasAccess: isAdmin || Boolean(active),
    expiresAt: isAdmin ? null : (active?.expires_at ?? null),
    planMonth,
    nextPrice: priceForMonth(planMonth),
    pendingOrder: pending
      ? {
          id: pending.id,
          amount: pending.amount,
          couponDiscount: pending.coupon_discount,
          createdAt: pending.created_at,
        }
      : null,
  }

  return NextResponse.json(state)
}