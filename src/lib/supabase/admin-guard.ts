import { NextResponse } from 'next/server'
import { getAdminClient, parseBearer, verifyUser } from '@/lib/supabase/server'
import { ADMIN_EMAIL } from '@/lib/billing'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface AdminContext {
  user: User
  client: SupabaseClient
}

/**
 * Guard for admin-only API routes. Verifies the JWT and checks the caller is
 * the admin account. Returns either an admin context or an error response.
 */
export async function requireAdmin(authHeader: string | null): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; res: NextResponse }
> {
  const client = getAdminClient()
  if (!client) {
    return { ok: false, res: NextResponse.json({ error: 'not_configured' }, { status: 500 }) }
  }
  const user = await verifyUser(parseBearer(authHeader))
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  if ((user.email ?? '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { ok: false, res: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  }
  return { ok: true, ctx: { user, client } }
}