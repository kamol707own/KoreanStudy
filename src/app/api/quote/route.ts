import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, parseBearer, verifyUser } from '@/lib/supabase/server'
import { discountedPrice, priceForMonth } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface OrderRow {
  status: string
}

/**
 * Preview the price of the next subscription. Validates an optional coupon
 * code and returns the final amount, so the payment form can show it before
 * the user submits.
 */
export async function POST(req: NextRequest) {
  const client = getAdminClient()
  if (!client) return NextResponse.json({ error: 'not_configured' }, { status: 500 })

  let body: { coupon?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const user = await verifyUser(parseBearer(req.headers.get('authorization')))
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const couponCode = typeof body.coupon === 'string' ? body.coupon.trim().toUpperCase() : ''

  const { data, error } = await client
    .from('orders')
    .select('status')
    .eq('user_id', user.id)

  if (error) {
    console.error('[quote] failed:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  const rows = (data ?? []) as unknown as OrderRow[]
  const approvedCount = rows.filter(r => r.status === 'approved').length
  const basePrice = priceForMonth(approvedCount + 1)

  let discount = 0
  if (couponCode) {
    const { data: coupon, error: couponError } = await client
      .from('coupons')
      .select('discount, used_at')
      .eq('code', couponCode)
      .maybeSingle()
    if (couponError) {
      console.error('[quote] coupon lookup failed:', couponError.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
    if (!coupon) {
      return NextResponse.json({ error: 'invalid_coupon' }, { status: 400 })
    }
    if (coupon.used_at) {
      return NextResponse.json({ error: 'coupon_used' }, { status: 400 })
    }
    discount = coupon.discount
  }

  return NextResponse.json({
    planMonth: approvedCount + 1,
    basePrice,
    discount,
    amount: discountedPrice(basePrice, discount),
  })
}