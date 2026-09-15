'use client'

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client'
import {
  subscribeSync, setSyncUser, pullSync, resolveSyncConflict,
  setupReconnectListener, type SyncStatus,
} from '@/lib/sync/client'
import { fail, ok, type Result } from '@/lib/result'
import type { SyncResolution, SyncVerdict } from '@/lib/sync/sync-core'
import { ADMIN_EMAIL, type AccessState } from '@/lib/billing'
import { AuthSheet } from '@/components/auth-sheet'
import { SyncConflictDialog } from '@/components/sync-conflict'

interface AccountUser {
  id: string
  email: string
  /** Display name (editable by the user). Falls back to email when empty. */
  name: string
  /** App-uploaded avatar URL. Never pulled from Google/other providers. */
  avatarUrl: string | null
}

type ConflictVerdict = Extract<SyncVerdict, { kind: 'conflict' }>

interface AccountContextValue {
  /** Null when signed out. The app works fully without an account. */
  user: AccountUser | null
  /** True once the stored session has been checked (or deemed unavailable). */
  authReady: boolean
  /** In-flight auth action, for button spinners. */
  busy: 'signin' | 'signup' | 'signout' | 'avatar' | 'delete' | null
  status: SyncStatus
  conflicts: ConflictVerdict[]
  /** True when the user just signed up (created within the last 60 seconds). */
  isNewUser: boolean
  /** Subscription / payment access state, or null while loading. */
  subscription: AccessState | null
  /** True once the subscription status has been fetched. */
  subscriptionLoaded: boolean
  /** True when this account is the site admin. */
  isAdmin: boolean
  openAuth: () => void
  refreshSubscription: () => Promise<void>
  signIn: (email: string, password: string) => Promise<Result<null>>
  signUp: (email: string, password: string) => Promise<Result<null>>
  signInWithGoogle: () => Promise<Result<null>>
  signOut: () => Promise<void>
  /** Upload a new profile picture. Accepts a File object. */
  updateAvatar: (file: File) => Promise<Result<null>>
  /** Remove the current profile picture. */
  removeAvatar: () => Promise<Result<null>>
  /** Update the user's display name. */
  updateProfile: (name: string) => Promise<Result<null>>
  /** Delete the user account and all synced data permanently. */
  deleteAccount: () => Promise<Result<null>>
  /** Clears the isNewUser flag after the welcome screen is dismissed. */
  dismissWelcome: () => void
  resolveConflict: (verdict: ConflictVerdict, resolution: SyncResolution) => void
}

const AccountContext = createContext<AccountContextValue | null>(null)

export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext)
  if (!value) throw new Error('useAccount must be used inside <AccountProvider>')
  return value
}

const EMAIL_ERRORS: Record<string, string> = {
  invalid_credentials: 'invalidLogin',
  email_exists: 'emailInUse',
  user_already_exists: 'emailInUse',
}

/** Turns a Supabase AuthApiError into an `auth` i18n key. */
export function mapAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  if (code === 'email_not_confirmed') return 'checkEmail'
  return EMAIL_ERRORS[code] ?? 'genericError'
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [busy, setBusy] = useState<AccountContextValue['busy']>(null)
  const [status, setStatus] = useState<SyncStatus>(isSupabaseConfigured() ? 'loading' : 'disabled')
  const [conflicts, setConflicts] = useState<ConflictVerdict[]>([])
  const [authOpen, setAuthOpen] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [subscription, setSubscription] = useState<AccessState | null>(null)
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false)

  // Own the whole auth + sync lifecycle for the page session.
  useEffect(() => {
    setupReconnectListener()
    const supabase = getSupabaseClient()

    if (!supabase) {
      queueMicrotask(() => setAuthReady(true))
      return
    }

    const applySession = (sessionUser: { id: string; email?: string | null; created_at?: string; user_metadata?: Record<string, unknown> }) => {
      const avatarUrl = typeof sessionUser.user_metadata?.app_avatar === 'string'
        ? sessionUser.user_metadata.app_avatar
        : null
      const name = typeof sessionUser.user_metadata?.display_name === 'string'
        ? sessionUser.user_metadata.display_name
        : ''
      setUser({ id: sessionUser.id, email: sessionUser.email ?? '', name, avatarUrl })
      setSyncUser(sessionUser.id)
      // Detect new user: account created within the last 60 seconds
      if (sessionUser.created_at) {
        const createdAt = new Date(sessionUser.created_at)
        const isNew = Date.now() - createdAt.getTime() < 60_000
        setIsNewUser(isNew)
      }
      return pullSync().then((verdicts) => {
        setConflicts(verdicts.filter(v => v.kind === 'conflict') as ConflictVerdict[])
        setAuthReady(true)
      })
    }

    const unsubscribe = subscribeSync((nextStatus) => {
      setStatus(nextStatus)
    })

    supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) void applySession(data.session.user)
      else setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          if (session?.user) void applySession(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSyncUser(null)
        setConflicts([])
        setSubscription(null)
        setAuthReady(true)
      }
    })

    return () => {
      subscription.unsubscribe()
      unsubscribe()
    }
  }, [])

  const runAuth = useCallback(async (
    action: 'signin' | 'signup',
    email: string,
    password: string
  ): Promise<Result<null>> => {
    const supabase = getSupabaseClient()
    if (!supabase) return fail('genericError')
    if (!email.trim() || password.length < 6) return fail('invalidInput')

    setBusy(action)
    try {
      if (action === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return fail(mapAuthError(error))
        return ok(null)
      }
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return fail(mapAuthError(error))
      // Email confirmation enabled → no session yet, tell the user to verify.
      if (data.user && !data.session) return fail('checkEmail')
      return ok(null)
    } catch {
      return fail('genericError')
    } finally {
      setBusy(null)
    }
  }, [])

  const signIn = useCallback((email: string, password: string) => runAuth('signin', email, password), [runAuth])
  const signUp = useCallback((email: string, password: string) => runAuth('signup', email, password), [runAuth])

  const signInWithGoogle = useCallback(async (): Promise<Result<null>> => {
    const supabase = getSupabaseClient()
    if (!supabase) return fail('genericError')
    setBusy('signin')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Return to the exact page the user is on. Its pathname already
          // carries the locale prefix (localePrefix: 'always'), so the
          // middleware won't rewrite it and the OAuth code/state params in
          // the querystring survive the redirect round-trip. Using a bare
          // '/' would get redirected to '/en' and could drop those params.
          redirectTo: window.location.origin + window.location.pathname,
        },
      })
      if (error) return fail('genericError')
      return ok(null)
    } catch {
      return fail('genericError')
    } finally {
      setBusy(null)
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    setBusy('signout')
    try {
      await supabase?.auth.signOut()
    } catch {
      // Best-effort; the SIGNED_OUT event still fires client-side.
    } finally {
      setBusy(null)
    }
  }, [])

  const updateAvatar = useCallback(async (file: File): Promise<Result<null>> => {
    const supabase = getSupabaseClient()
    if (!supabase) return fail('genericError')
    setBusy('avatar')
    try {
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${user!.id}/avatar.${ext}`

      // Upload (upsert if exists)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) return fail('genericError')

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = urlData.publicUrl

      // Update user metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: { app_avatar: avatarUrl },
      })
      if (metaError) return fail('genericError')

      // Update local state
      setUser(prev => prev ? { ...prev, avatarUrl } : prev)
      return ok(null)
    } catch {
      return fail('genericError')
    } finally {
      setBusy(null)
    }
  }, [user])

  const removeAvatar = useCallback(async (): Promise<Result<null>> => {
    const supabase = getSupabaseClient()
    if (!supabase || !user) return fail('genericError')
    setBusy('avatar')
    try {
      // Find and delete existing avatar files
      const { data: files } = await supabase.storage.from('avatars').list(user.id)
      if (files && files.length > 0) {
        const paths = files.map(f => `${user.id}/${f.name}`)
        await supabase.storage.from('avatars').remove(paths)
      }

      // Clear app_avatar from metadata
      const { error } = await supabase.auth.updateUser({
        data: { app_avatar: null },
      })
      if (error) return fail('genericError')

      setUser(prev => prev ? { ...prev, avatarUrl: null } : prev)
      return ok(null)
    } catch {
      return fail('genericError')
    } finally {
      setBusy(null)
    }
  }, [user])

  const updateProfile = useCallback(async (name: string): Promise<Result<null>> => {
    const supabase = getSupabaseClient()
    if (!supabase) return fail('genericError')
    setBusy('avatar')
    try {
      const trimmed = name.trim()
      const { error } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
      })
      if (error) return fail('genericError')
      setUser(prev => prev ? { ...prev, name: trimmed } : prev)
      return ok(null)
    } catch {
      return fail('genericError')
    } finally {
      setBusy(null)
    }
  }, [])

  const deleteAccount = useCallback(async (): Promise<Result<null>> => {
    const supabase = getSupabaseClient()
    if (!supabase) return fail('genericError')
    setBusy('delete')
    try {
      // The client cannot delete its own auth user — send the JWT to a
      // server route that deletes with the service-role key.
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) return fail('genericError')

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        console.error('[delete_account] api failed:', body)
        if (body.error === 'not_configured') return fail('deleteAccountNotConfigured')
        if (body.error === 'unauthorized') return fail('genericError')
        return fail('deleteAccountForbidden')
      }

      // The user is now deleted — sign out locally
      setUser(null)
      setSyncUser(null)
      setConflicts([])
      setSubscription(null)
      setSubscriptionLoaded(true)
      return ok(null)
    } catch (err) {
      console.error('[delete_account] unexpected:', err)
      return fail('genericError')
    } finally {
      setBusy(null)
    }
  }, [])

  const openAuth = useCallback(() => setAuthOpen(true), [])

  const refreshSubscription = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setSubscription(null)
      setSubscriptionLoaded(true)
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    if (!accessToken) {
      setSubscription(null)
      setSubscriptionLoaded(true)
      return
    }
    try {
      const res = await fetch('/api/access', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return
      setSubscription((await res.json()) as AccessState)
    } catch {
      // keep the previous value
    } finally {
      setSubscriptionLoaded(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auth-triggered data fetch
    if (user) void refreshSubscription()
    else if (authReady) setSubscriptionLoaded(true)
  }, [user, authReady, refreshSubscription])

  const dismissWelcome = useCallback(() => setIsNewUser(false), [])

  const resolveConflict = useCallback((
    verdict: ConflictVerdict,
    resolution: SyncResolution
  ) => {
    const key = verdict
    void resolveSyncConflict(verdict.table, verdict, resolution).then(() => {
      setConflicts(prev => prev.filter(v => v !== key))
    })
  }, [])

  const isAdmin = (user?.email ?? '').toLowerCase() === ADMIN_EMAIL.toLowerCase()

  const value = useMemo<AccountContextValue>(() => ({
    user, authReady, busy, status, conflicts, isNewUser, subscription,
    subscriptionLoaded, isAdmin,
    openAuth, signIn, signUp, signInWithGoogle, signOut,
    updateAvatar, removeAvatar, updateProfile, deleteAccount,
    dismissWelcome, resolveConflict, refreshSubscription,
  }), [user, authReady, busy, status, conflicts, isNewUser, subscription, subscriptionLoaded, isAdmin, openAuth, signIn, signUp, signInWithGoogle, signOut, updateAvatar, removeAvatar, updateProfile, deleteAccount, dismissWelcome, resolveConflict, refreshSubscription])

  return (
    <AccountContext.Provider value={value}>
      {children}
      <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      <SyncConflictDialog conflicts={conflicts} onResolve={resolveConflict} />
    </AccountContext.Provider>
  )
}