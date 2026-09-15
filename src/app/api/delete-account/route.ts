import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Deletes the current user's account and all associated data.
 *
 * The client CANNOT delete its own auth user (RLS + no anon permission on
 * auth.users), so this runs server-side with the service-role key, which
 * bypasses RLS. The caller's JWT is validated first so nobody can delete
 * someone else's account.
 *
 * Deleting the auth.users row cascades to progress/srs (FK ON DELETE CASCADE).
 * Avatar files are removed explicitly from Storage.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in your .env.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 })
  }

  let accessToken: string
  try {
    const body = (await req.json()) as { accessToken?: unknown }
    accessToken = typeof body.accessToken === 'string' ? body.accessToken : ''
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  if (!accessToken) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  // 1. Validate the token — gives us the real user id (no trusting the client).
  const verifier = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error: verifyError } = await verifier.auth.getUser(accessToken)
  if (verifyError || !user) {
    console.error('[delete_account] token verification failed:', verifyError?.message ?? 'no user')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Delete avatar files from Storage (no FK cascade to Storage).
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  try {
    const { data: files } = await admin.storage.from('avatars').list(user.id)
    if (files && files.length > 0) {
      await admin.storage
        .from('avatars')
        .remove(files.map((f) => `${user.id}/${f.name}`))
    }
  } catch (err) {
    console.error('[delete_account] avatar cleanup failed:', err)
  }

  // 3. Delete the auth user (cascades to progress/srs via FK).
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('[delete_account] admin.deleteUser failed:', deleteError.message, deleteError.code)
    return NextResponse.json({
      error: 'delete_failed',
      message: deleteError.message,
      code: deleteError.code,
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}