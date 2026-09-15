import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * List all subscription orders for the admin, newest first, with coupon code
 * joined in for reference and a short-lived signed URL for each payment-proof
 * screenshot.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req.headers.get('authorization'))
  if (!guard.ok) return guard.res

  const { data, error } = await guard.ctx.client
    .from('orders')
    .select('*, coupons(code)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/orders] failed:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  const orders = (data ?? []) as unknown as Array<Record<string, unknown> & { proof_path: string | null }>
  for (const order of orders) {
    if (order.proof_path) {
      const { data: signed } = await guard.ctx.client.storage
        .from('payment-proofs')
        .createSignedUrl(order.proof_path, 3600)
      order.proofUrl = signed?.signedUrl ?? null
    } else {
      order.proofUrl = null
    }
  }

  return NextResponse.json({ orders })
}