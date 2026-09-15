import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KEYS = ['seller_card_number', 'seller_card_name'] as const

/**
 * Seller card settings — read or update the receiving card the landing page
 * shows to users. Admin only.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req.headers.get('authorization'))
  if (!guard.ok) return guard.res

  const { data, error } = await guard.ctx.client.from('settings').select('key, value').in('key', [...KEYS])
  if (error) {
    console.error('[admin/settings] read failed:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  const map = new Map((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value]))
  return NextResponse.json({
    sellerCardNumber: map.get('seller_card_number') ?? '',
    sellerCardName: map.get('seller_card_name') ?? '',
  })
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req.headers.get('authorization'))
  if (!guard.ok) return guard.res

  let body: { sellerCardNumber?: unknown; sellerCardName?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const sellerCardNumber = typeof body.sellerCardNumber === 'string' ? body.sellerCardNumber.replace(/\D/g, '').slice(0, 19) : ''
  const sellerCardName = typeof body.sellerCardName === 'string' ? body.sellerCardName.trim().slice(0, 60) : ''

  if (!sellerCardNumber) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const upsert = (key: string, value: string) =>
    guard.ctx.client
      .from('settings')
      .upsert({ key, value, updated_at: now }, { onConflict: 'key' })

  const upserts = [
    upsert('seller_card_number', sellerCardNumber),
    upsert('seller_card_name', sellerCardName || ''),
  ]
  const results = await Promise.all(upserts)
  const failed = results.find(r => r.error)
  if (failed) {
    console.error('[admin/settings] write failed:', failed.error?.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sellerCardNumber, sellerCardName })
}