import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, parseBearer, verifyUser } from '@/lib/supabase/server'
import { discountedPrice, priceForMonth } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROOF_PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[\w.-]+$/i

/**
 * Create a subscription order. Users pay by transferring money to the seller's
 * card (shown on the landing page) and may attach an optional screenshot proof
 * already uploaded to storage. Computes the price from how many months the user
 * already paid and stores the order as pending. Everything is written with the
 * service_role client (orders tables have no user insert policy).
 */
export async function POST(req: NextRequest) {
  const client = getAdminClient()
  if (!client) return NextResponse.json({ error: 'not_configured' }, { status: 500 })

  let body: { coupon?: unknown; proofPath?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const user = await verifyUser(parseBearer(req.headers.get('authorization')))
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const couponCode = typeof body.coupon === 'string' ? body.coupon.trim().toUpperCase() : ''
  const proofPath = typeof body.proofPath === 'string' ? body.proofPath.trim() : ''

  // Reject duplicates: no new order while a pending one exists, and no
  // stacking months ahead — if access is still active, they must wait.
  const { data, error } = await client
    .from('orders')
    .select('status, expires_at')
    .eq('user_id', user.id)
  if (error) {
    console.error('[subscribe] read failed:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  const rows = (data ?? []) as unknown as { status: string; expires_at: string | null }[]

  if (rows.some(r => r.status === 'pending')) {
    return NextResponse.json({ error: 'pending_exists' }, { status: 409 })
  }
  const active = rows.some(r => r.status === 'approved' && r.expires_at && new Date(r.expires_at) > new Date())
  if (active) {
    return NextResponse.json({ error: 'already_active' }, { status: 409 })
  }

  const approvedCount = rows.filter(r => r.status === 'approved').length
  const planMonth = approvedCount + 1
  const basePrice = priceForMonth(planMonth)

  // Optional coupon
  let discount = 0
  let couponId: string | null = null
  if (couponCode) {
    const { data: coupon, error: couponError } = await client
      .from('coupons')
      .select('id, discount, used_at')
      .eq('code', couponCode)
      .maybeSingle()
    if (couponError) {
      console.error('[subscribe] coupon lookup failed:', couponError.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
    if (!coupon) return NextResponse.json({ error: 'invalid_coupon' }, { status: 400 })
    if (coupon.used_at) return NextResponse.json({ error: 'coupon_used' }, { status: 400 })
    discount = coupon.discount
    couponId = coupon.id
  }

  const amount = discountedPrice(basePrice, discount)

  // Optional payment-proof screenshot, already uploaded client-side. Must live
  // under the caller's own uid prefix to prevent attaching other users' files.
  let proof: string | null = null
  if (proofPath) {
    if (!PROOF_PATH_RE.test(proofPath) || !proofPath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'invalid_proof' }, { status: 400 })
    }
    proof = proofPath
  }

  const { data: order, error: insertError } = await client
    .from('orders')
    .insert({
      user_id: user.id,
      email: user.email ?? null,
      plan_month: planMonth,
      amount,
      proof_path: proof,
      coupon_id: couponId,
      coupon_discount: discount || null,
    })
    .select('id, plan_month, amount, proof_path, coupon_discount, created_at')
    .single()

  if (insertError) {
    console.error('[subscribe] insert failed:', insertError.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  // Reserve the single-use coupon
  if (couponId) {
    await client.from('coupons').update({ used_at: new Date().toISOString(), used_by: user.id })
      .eq('id', couponId)
  }

  return NextResponse.json({ ok: true, order }, { status: 201 })
}