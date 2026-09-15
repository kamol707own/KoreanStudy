import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

/** Admin client (service_role) — bypasses RLS. Null when not configured. */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Verify a user's access token and return the authenticated user.
 * Returns null when invalid/expired or when Supabase isn't configured.
 */
export async function verifyUser(accessToken: string): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key || !accessToken) return null
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.getUser(accessToken)
  if (error || !data.user) return null
  return data.user
}

/** Strip the "Bearer " prefix from an Authorization header value. */
export function parseBearer(authHeader: string | null): string {
  if (!authHeader) return ''
  const match = /^Bearer\s+(.+)$/i.exec(authHeader)
  return match ? match[1].trim() : ''
}