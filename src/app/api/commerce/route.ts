import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PUBLIC_KEYS = ['seller_card_number', 'seller_card_name'] as const

/**
 * Public payment details: the seller's receiving card number + name, shown on
 * the landing page so users know where to transfer. Returns 404 when unset.
 */
export async function GET() {
  const client = getAdminClient()
  if (!client) return NextResponse.json({ error: 'not_configured' }, { status: 500 })

  const { data, error } = await client.from('settings').select('key, value').in('key', [...PUBLIC_KEYS])
  if (error) {
    console.error('[commerce] failed:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  const rowMap = new Map((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value]))
  const sellerCardNumber = rowMap.get('seller_card_number') ?? ''
  const sellerCardName = rowMap.get('seller_card_name') ?? ''

  if (!sellerCardNumber) {
    return NextResponse.json({ error: 'not_configured' }, { status: 404 })
  }

  return NextResponse.json({ sellerCardNumber, sellerCardName })
}