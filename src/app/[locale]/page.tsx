'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useAppLocale } from '@/i18n/use-app-locale'
import { useAccount } from '@/components/account-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatWon, PROMO_PRICE_WON, FULL_PRICE_WON, type AccessState } from '@/lib/billing'
import { Cloud, Brain, BookOpen, Sun, Moon, ArrowRight, Loader2, CheckCircle2, Clock, CreditCard, ShieldCheck, UserRound, Menu, X } from 'lucide-react'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

const FEATURES = [
  { icon: Cloud, key: 'featureSync', titleKey: 'featureSyncTitle', descKey: 'featureSyncDesc' },
  { icon: Brain, key: 'featureSrs', titleKey: 'featureSrsTitle', descKey: 'featureSrsDesc' },
  { icon: BookOpen, key: 'featureCurriculum', titleKey: 'featureCurriculumTitle', descKey: 'featureCurriculumDesc' },
] as const

const STEPS = ['howStep1Title', 'howStep2Title', 'howStep3Title'] as const

/** Small navbar for the landing page — theme + locale matches the app. */
function LandingNav() {
  const t = useTranslations('landing')
  const locale = useAppLocale()
  const { user, isAdmin, openAuth, authReady } = useAccount()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const applied = document.documentElement.getAttribute('data-theme')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time DOM sync
    if (applied === 'light' || applied === 'dark') setTheme(applied)
  }, [])

  const toggleTheme = useCallback(() => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    const next = current === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.cookie = `korean-study-theme=${next};path=/;max-age=31536000;samesite=lax`
  }, [])

  const mobileLinks: { href: string; label: string }[] = [
    { href: '#features', label: t('navFeatures') },
    { href: '#pricing', label: t('navPricing') },
    { href: '#how', label: t('navHow') },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/app-logo.png" alt="Study Korean" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="font-semibold tracking-tight text-foreground">Study Korean</span>
        </div>

        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {mobileLinks.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 transition-colors hover:text-foreground">{l.label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin" className="hidden rounded-md px-3 py-2 text-sm text-korean transition-colors hover:text-korean-dim sm:block">
              {t('navAdmin')}
            </Link>
          )}

          {/* Locale switch */}
          <div className="flex items-center rounded-lg border border-border text-xs font-medium">
            {(['en', 'zh'] as const).map((l) => (
              <Link
                key={l}
                href="/"
                locale={l}
                className={cn(
                  'rounded-md px-3 py-2 transition-colors',
                  locale === l ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l === 'zh' ? '中文' : 'EN'}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label={t('navToggleTheme')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('navCloseMenu') : t('navMenu')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {authReady && user ? (
            <button
              type="button"
              onClick={openAuth}
              title={user.email}
              aria-label={user.name || user.email}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border transition-colors hover:border-foreground/40"
            >
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name || user.email} width={36} height={36} unoptimized className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                  <UserRound className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </span>
              )}
            </button>
          ) : (
            <Button size="sm" onClick={openAuth}>{t('navSignIn')}</Button>
          )}
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border/60 bg-background/95 px-4 py-2 backdrop-blur md:hidden">
          {mobileLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center py-3 text-sm text-korean transition-colors hover:text-korean-dim">
              {t('navAdmin')}
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}

/** The payment form, shown to signed-in, non-paying users. */
function PaymentForm({ subscription }: { subscription: AccessState }) {
  const t = useTranslations('payment')
  const { refreshSubscription } = useAccount()
  const [sellerCardNumber, setSellerCardNumber] = useState<string | null>(null)
  const [sellerCardName, setSellerCardName] = useState('')
  const [sellerLoading, setSellerLoading] = useState(true)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const basePrice = subscription.nextPrice
  const amount = discount > 0
    ? Math.round((basePrice * (100 - discount)) / 100 / 100) * 100
    : basePrice

  useEffect(() => {
    let cancelled = false
    fetch('/api/commerce')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled) return
        setSellerCardNumber(d ? (d.sellerCardNumber ?? null) : null)
        setSellerCardName(d ? (d.sellerCardName ?? '') : '')
        setSellerLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setSellerCardNumber(null)
        setSellerCardName('')
        setSellerLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const previewCoupon = async (code: string) => {
    setError(null)
    if (!code.trim()) return setDiscount(0)
    setBusy(true)
    try {
      const supabase = (await import('@/lib/supabase/client')).getSupabaseClient()
      const { data: { session } } = await supabase!.auth.getSession()
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ coupon: code }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setError(body.error === 'invalid_coupon' ? 'invalidCoupon' : body.error === 'coupon_used' ? 'couponUsed' : 'invalidCoupon')
        setDiscount(0)
        return
      }
      const data = await res.json() as { discount: number }
      setDiscount(data.discount)
    } catch {
      setError('genericError')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!confirming && amount > 0) {
      setConfirming(true)
      return
    }
    setError(null)
    setConfirming(false)
    setBusy(true)
    try {
      const supabase = (await import('@/lib/supabase/client')).getSupabaseClient()
      if (!supabase) throw new Error('no client')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || !session.access_token) {
        setError('server_unauthorized')
        return
      }

      // Optional proof screenshot: upload directly to storage first, then pass
      // the returned path along with the order.
      let proofPath = ''
      if (proofFile) {
        const ext = proofFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
        const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(path, proofFile, { upsert: true, contentType: proofFile.type })
        if (!uploadError) proofPath = path
        else {
          // Proof is optional — surface the failure as a warning but still
          // allow the order (payments are confirmed manually).
          console.error('[proof] upload failed:', uploadError.message)
          setError('uploadFailed')
        }
      }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          proofPath,
          coupon,
        }),
      })
      const body = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        console.error('[subscribe] http', res.status, body)
        if (body.error === 'pending_exists') return setError('pendingExists')
        if (body.error === 'already_active') return setError('alreadyActive')
        if (body.error === 'invalid_coupon') return setError('invalidCoupon')
        if (body.error === 'coupon_used') return setError('couponUsed')
        if (body.error === 'invalid_proof') return setError('invalidProof')
        // Show the raw server code so the real cause is visible instead of a
        // generic message. Code-only keys render the literal code.
        if (typeof body.error === 'string') return setError(`server_${body.error}`)
        return setError(`server_http${res.status}`)
      }
      setDone(true)
      await refreshSubscription()
    } catch {
      setError('genericError')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Clock className="h-8 w-8 text-gold" />
        <p className="text-sm font-semibold text-foreground">{t('successPending')}</p>
        <p className="text-xs text-muted-foreground">{t('successPendingDesc')}</p>
      </div>
    )
  }

  const sellerMissing = !sellerLoading && sellerCardNumber === null

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
      {amount === 0 ? (
        <p className="rounded-lg bg-green/10 px-3 py-2 text-xs text-green">
          {t('freeWithCoupon')}
        </p>
      ) : sellerLoading ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/40 p-4">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-1 flex items-center justify-between rounded-lg bg-card px-3 py-2.5">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-36 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-14 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ) : sellerCardNumber === null ? (
        <p className="rounded-lg bg-red/10 px-3 py-2 text-xs text-red">
          {t('sellerMissing')}
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/40 p-4">
          <p className="text-xs font-medium text-muted-foreground">{t('payToTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('payToDesc')}</p>
          <div className="mt-1 flex items-center justify-between rounded-lg bg-card px-3 py-2.5">
            <div>
              <p className="font-mono text-sm font-semibold tracking-wide text-foreground">
                {sellerCardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
              </p>
              {sellerCardName && (
                <p className="mt-0.5 text-xs text-muted-foreground">{sellerCardName}</p>
              )}
            </div>
            <span className={cn('text-sm font-bold text-foreground', discount > 0 && 'text-korean')}>
              {formatWon(amount)}
            </span>
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{t('proofLabel')}</span>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted"
        />
        {proofFile && (
          <p className="text-[11px] text-muted-foreground">{t('proofAttached', { name: proofFile.name })}</p>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{t('coupon')}</span>
        <div className="flex gap-2">
          <Input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="SAMPLE30"
            className="flex-1 uppercase"
          />
          <Button type="button" variant="outline" disabled={busy || !coupon.trim()} onClick={() => void previewCoupon(coupon)} className="gap-1.5">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('couponApply')}
          </Button>
        </div>
      </label>

      {error && (
        <p className="rounded-lg bg-red/10 px-3 py-2 text-xs text-red">{t(error)}</p>
      )}

      {amount > 0 && (
        <div className="mt-1 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">{t('amountDue')}</span>
          <span className={cn('text-sm font-bold text-foreground', discount > 0 && 'text-korean')}>
            {formatWon(amount)}
          </span>
        </div>
      )}
      {(coupon.trim() && discount === 0 && !error) && (
        <p className="text-[11px] text-muted-foreground">{t('applyCouponHint')}</p>
      )}

      <Button type="submit" disabled={busy || sellerMissing || sellerLoading} className="mt-1 w-full gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t(confirming ? 'submitConfirm' : 'submit')}
      </Button>
      {confirming && (
        <div className="flex flex-col gap-2.5 rounded-lg bg-amber-500/10 px-3.5 py-3">
          <p className="flex items-start gap-2 text-xs font-medium text-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            {t('confirmCheckTitle')}
          </p>
          <p className="pl-6 text-xs leading-relaxed text-muted-foreground">{t('confirmCheckDesc')}</p>
          <p className="pl-6 text-xs leading-relaxed text-muted-foreground">{t('confirmCheckConsequence')}</p>
          <div className="flex gap-2 pl-6">
            <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
              {t('yesProofPaid')}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setConfirming(false)}>
              {t('goBack')}
            </Button>
          </div>
        </div>
      )}
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-green" />
        {t('manualNote')}
      </p>
    </form>
  )
}

export default function LandingPage() {
  const t = useTranslations('landing')
  const tLogin = useTranslations('login')
  const tWelcome = useTranslations('welcome')
  const locale = useAppLocale()
  const router = useRouter()
  const { user, authReady, openAuth, isNewUser, dismissWelcome, signInWithGoogle, busy, subscription, subscriptionLoaded } = useAccount()
  const [googleError, setGoogleError] = useState(false)

  // Signed-in users with active access go straight into the app.
  useEffect(() => {
    if (authReady && user && subscriptionLoaded && subscription?.hasAccess) {
      router.push('/app')
    }
  }, [authReady, user, subscription, subscriptionLoaded, router])

  const showWelcome = Boolean(user && isNewUser)

  const price = subscription?.nextPrice ?? PROMO_PRICE_WON
  const isPromo = price === PROMO_PRICE_WON

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-korean/30 bg-korean/10 px-3 py-1 text-xs font-medium text-korean">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('heroBadge')}
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => {
                  if (!user) openAuth()
                  else document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="gap-2"
              >
                {user ? t('heroCtaSubscribed') : t('heroCta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="#how" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                {t('howLink')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
              <div key={titleKey} className="rounded-xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-korean/15 text-korean">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{t(titleKey)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing + payment */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('pricingTitle')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('pricingSubtitle')}</p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 p-6 text-center">
              <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold">
                {t('planPromo')}
              </span>
              <div className="mt-4 flex items-end justify-center gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">{formatWon(price)}</span>
                <span className="pb-1.5 text-sm text-muted-foreground">{t('perMonth')}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {isPromo
                  ? t('promoFull', { price: formatWon(FULL_PRICE_WON) })
                  : t('regularPricing')}
              </p>
            </div>

            <div className="p-6">
              {/* Not signed in */}
              {!authReady ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : !user ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">{t('signInToSubscribe')}</p>
                  <Button className="w-full gap-2" onClick={openAuth}>
                    {tLogin('signIn')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={busy === 'signin'}
                    onClick={() => void (async () => {
                      setGoogleError(false)
                      const result = await signInWithGoogle()
                      if (!result.ok) setGoogleError(true)
                    })()}
                  >
                    {busy === 'signin' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                    {tLogin('continueWithGoogle')}
                  </Button>
                  {googleError && (
                    <p className="text-xs text-red">{t('genericError')}</p>
                  )}
                </div>
              ) : showWelcome ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <p className="text-sm font-semibold text-foreground">{tWelcome('title')}</p>
                  <p className="text-xs text-muted-foreground">{tWelcome('description')}</p>
                  <Button className="mt-2 gap-2" onClick={dismissWelcome}>
                    {t('heroCtaSubscribed')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : !subscriptionLoaded ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : subscription?.hasAccess ? (
                subscription.expiresAt ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green" />
                    <p className="text-sm font-semibold text-foreground">
                      {t('activeUntil', { date: formatDate(subscription.expiresAt, locale) })}
                    </p>
                  </div>
                ) : null
              ) : subscription?.pendingOrder ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Clock className="h-8 w-8 text-gold" />
                  <p className="text-sm font-semibold text-foreground">{t('pendingTitle')}</p>
                  <p className="text-xs text-muted-foreground">{t('pendingDesc')}</p>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-center text-sm font-semibold text-foreground">{t('subscribeCard')}</p>
                  {subscription ? <PaymentForm subscription={subscription} /> : null}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">{t('howTitle')}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((key, i) => (
              <div key={key} className="rounded-xl border border-border bg-card p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-korean/15 text-sm font-bold text-korean">{i + 1}</span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{t(key)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(`${key}Desc` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>{t('footerNote')}</span>
          </div>
          <span>{t('footerContact', { email: 'kamol.707.own@gmail.com' })}</span>
        </div>
      </footer>
    </div>
  )
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale)
}