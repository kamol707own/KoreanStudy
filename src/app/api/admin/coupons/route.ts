import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { DISCOUNTS, type CouponDiscount } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

function randomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

/** List all coupons, newest first. */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req.headers.get('authorization'))
  if (!guard.ok) return guard.res

  const { data, error } = await guard.ctx.client
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[admin/coupons] failed:', error.message)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }
  return NextResponse.json({ coupons: data ?? [] })
}

/** Create a new single-use coupon code with a chosen discount. */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req.headers.get('authorization'))
  if (!guard.ok) return guard.res

  let body: { discount?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  const discount = Number(body.discount)
  if (!(DISCOUNTS as readonly number[]).includes(discount)) {
    return NextResponse.json({ error: 'invalid_discount' }, { status: 400 })
  }

  // Retry on the rare unique-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const { data, error } = await guard.ctx.client
      .from('coupons')
      .insert({ code, discount: discount as CouponDiscount })
      .select('id, code, discount, created_at')
      .single()
    if (!error) return NextResponse.json({ coupon: data }, { status: 201 })
    if (error.code !== '23505') {
      console.error('[admin/coupons] insert failed:', error.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'db_error' }, { status: 500 })
}