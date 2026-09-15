import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/** True when the two Supabase env vars are present in the environment. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey)
}

let client: SupabaseClient | null = null

/**
 * Browser-side Supabase client. Returns null when the env vars are missing
 * (the app keeps working fully offline/without an account — sync is optional).
 * Uses a PKCE, localStorage-persisted session so a reload keeps you signed in.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }
  return client
}