import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { GRANT_DAYS } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

interface OrderRow {
  id: string
  status: string
  coupon_id: string | null
}

/**
 * Approve a pending order: grants 30 days of access (extending from now or the
 * user's existing expiry, whichever is later). Reject marks it rejected and
 * releases its coupon back to the pool.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req.headers.get('authorization'))
  if (!guard.ok) return guard.res

  const { id } = await params
  let body: { action?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json({ error: 'bad_action' }, { status: 400 })
  }

  const { data: order, error: readError } = await guard.ctx.client
    .from('orders')
    .select('id, status, coupon_id, user_id, expires_at')
    .eq('id', id)
    .single()

  if (readError || !order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const row = order as unknown as OrderRow & { user_id: string; expires_at: string | null }
  if (row.status !== 'pending') {
    return NextResponse.json({ error: 'already_processed' }, { status: 409 })
  }

  if (body.action === 'approve') {
    // Base the grant on the user's current access window, so renewals extend.
    const { data: approved } = await guard.ctx.client
      .from('orders')
      .select('expires_at')
      .eq('user_id', row.user_id)
      .eq('status', 'approved')
      .order('expires_at', { ascending: false })
      .limit(1)
    const prev = (approved ?? [])[0] as { expires_at: string | null } | undefined
    const prevMs = prev?.expires_at ? new Date(prev.expires_at).getTime() : 0
    const base = Math.max(Date.now(), prevMs)
    const expiresAt = new Date(base + GRANT_DAYS * DAY_MS).toISOString()

    const { error: updateError } = await guard.ctx.client
      .from('orders')
      .update({ status: 'approved', approved_at: new Date().toISOString(), expires_at: expiresAt })
      .eq('id', id)
    if (updateError) {
      console.error('[admin/order] approve failed:', updateError.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, expiresAt })
  }

  // Reject — release the coupon so it can be used again.
  if (row.coupon_id) {
    await guard.ctx.client
      .from('coupons')
      .update({ used_at: null, used_by: null })
      .eq('id', row.coupon_id)
  }
  const { error: rejectError } = await guard.ctx.client
    .from('orders')
    .update({ status: 'rejected' })
    .eq('id', id)
  if (rejectError) {
    console.error('[admin/order] reject failed:', rejectError.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}