'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useAccount } from '@/components/account-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatWon, DISCOUNTS, type CouponDiscount } from '@/lib/billing'
import { ArrowLeft, Check, Copy, ImageIcon, Loader2 } from 'lucide-react'

interface Order {
  id: string
  email: string | null
  plan_month: number
  amount: number
  coupon_discount: number | null
  coupons: { code: string } | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at: string | null
  expires_at: string | null
  proof_path: string | null
  proofUrl: string | null
}

interface Coupon {
  id: string
  code: string
  discount: number
  created_at: string
  used_at: string | null
  used_by: string | null
}

interface SellerSettings {
  sellerCardNumber: string
  sellerCardName: string
}

export default function AdminPage() {
  const t = useTranslations('admin')
  const tLand = useTranslations('landing')
  const router = useRouter()
  const { user, authReady, isAdmin } = useAccount()
  const [tab, setTab] = useState<'orders' | 'coupons' | 'settings'>('orders')
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [settings, setSettings] = useState<SellerSettings | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<SellerSettings>({ sellerCardNumber: '', sellerCardName: '' })
  const [editingSettings, setEditingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [working, setWorking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [proofDialog, setProofDialog] = useState<string | null>(null)
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null)

  const apiFetch = async (path: string, init?: RequestInit) => {
    const supabase = (await import('@/lib/supabase/client')).getSupabaseClient()
    const { data: { session } } = await supabase!.auth.getSession()
    return fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
    })
  }

  const refreshOrders = useCallback(async () => {
    const res = await apiFetch('/api/admin/orders')
    if (!res.ok) { setError('failed'); return }
    const body = await res.json()
    setOrders(body.orders as Order[])
  }, [])

  const refreshCoupons = useCallback(async () => {
    const res = await apiFetch('/api/admin/coupons')
    if (!res.ok) { setError('failed'); return }
    const body = await res.json()
    setCoupons(body.coupons as Coupon[])
  }, [])

  const refreshSettings = useCallback(async () => {
    const res = await apiFetch('/api/admin/settings')
    if (!res.ok) return
    const data = (await res.json()) as SellerSettings
    setSettings(data)
    setSettingsDraft(data)
  }, [])

  useEffect(() => {
    if (authReady && isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
      void refreshOrders()
      void refreshCoupons()
      void refreshSettings()
    }
  }, [authReady, isAdmin, refreshOrders, refreshCoupons, refreshSettings])

  const act = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      setConfirmRejectId(id)
      return
    }
    setWorking(id)
    const res = await apiFetch(`/api/admin/orders/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
    setWorking(null)
    if (!res.ok) { setError('failed'); return }
    await refreshOrders()
  }

  const confirmReject = async () => {
    if (!confirmRejectId) return
    setWorking(confirmRejectId)
    const res = await apiFetch(`/api/admin/orders/${confirmRejectId}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject' }),
    })
    setWorking(null)
    setConfirmRejectId(null)
    if (!res.ok) { setError('failed'); return }
    await refreshOrders()
  }

  const genCoupon = async (discount: CouponDiscount) => {
    setWorking('new')
    const res = await apiFetch('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({ discount }),
    })
    setWorking(null)
    if (!res.ok) { setError('failed'); return }
    await refreshCoupons()
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsError(null)
    setSettingsSaved(false)
    if (!settingsDraft.sellerCardNumber.trim()) {
      setSettingsError('settingsCardRequired')
      return
    }
    setWorking('settings')
    const res = await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsDraft),
    })
    setWorking(null)
    if (!res.ok) { setSettingsError('genericError'); return }
    setSettings({ ...settingsDraft })
    setSettingsSaved(true)
    setEditingSettings(false)
  }

  // Unauthorized → show plain screen
  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }
  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-muted-foreground">{t('notAuthorized')}</p>
        <Button variant="outline" onClick={() => router.push('/app')}>{tLand('openApp')}</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/app-logo.png" alt="Study Korean" width={32} height={32} className="h-8 w-8 rounded-lg" />
            <h1 className="text-lg font-bold tracking-tight text-foreground">{t('title')}</h1>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => router.push('/app')}>
            <ArrowLeft className="h-4 w-4" />
            {tLand('navBack')}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted/60 p-1 sm:w-fit">
          {(['orders', 'coupons', 'settings'] as const).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={cn(
                'h-9 rounded-md px-4 text-xs font-medium transition-colors sm:text-sm',
                tab === tabKey ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tabKey === 'orders' ? t('ordersTab') : tabKey === 'coupons' ? t('couponsTab') : t('settingsTab')}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red/10 px-3 py-2 text-xs text-red">{t('genericError')}</p>
        )}

        {tab === 'orders' && (
          <div className="mt-6">
            {/* Balance */}
            <div className="mb-6 rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">{t('balance')}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {orders === null ? '—' : formatWon(orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + o.amount, 0))}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('balanceDesc')}</p>
            </div>

            {/* Pending */}
            <h2 className="mb-3 text-sm font-semibold text-foreground">{t('pendingHeader')}</h2>
            {orders === null ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : orders.filter(o => o.status === 'pending').length === 0 ? (
              <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">{t('emptyOrders')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.filter(o => o.status === 'pending').map(o => (
                  <OrderCard key={o.id} order={o} acting={working === o.id} onAct={act} onViewProof={setProofDialog} />
                ))}
              </div>
            )}

            {/* History */}
            <h2 className="mb-3 mt-8 text-sm font-semibold text-foreground">{t('historyHeader')}</h2>
            {orders === null ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : orders.filter(o => o.status !== 'pending').length === 0 ? (
              <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">{t('emptyOrders')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.filter(o => o.status !== 'pending').map(o => (
                  <OrderCard key={o.id} order={o} acting={working === o.id} onAct={act} onViewProof={setProofDialog} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'coupons' && (
          <div className="mt-6">
            {/* Generate */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground">{t('generateCoupon')}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {DISCOUNTS.map(d => (
                  <Button
                    key={d}
                    variant="outline"
                    disabled={working === 'new'}
                    onClick={() => void genCoupon(d)}
                  >
                    {working === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {d}%
                  </Button>
                ))}
              </div>
            </div>

            {/* List */}
            <h2 className="mb-3 mt-8 text-sm font-semibold text-foreground">{t('allCoupons')}</h2>
            {coupons === null ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : coupons.length === 0 ? (
              <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">{t('emptyCoupons')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {coupons.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-foreground">{c.code}</span>
                      <Badge variant={c.used_at ? 'secondary' : 'default'}>{c.discount}%</Badge>
                      <span className={cn('text-xs', c.used_at ? 'text-muted-foreground' : 'text-green')}>
                        {c.used_at ? t('used') : t('unused')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copy(c.code)}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {copied === c.code ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === c.code ? t('copied') : t('copy')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground">{t('settingsTab')}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t('settingsDesc')}</p>
              {editingSettings ? (
                <form onSubmit={(e) => void saveSettings(e)} className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{t('sellerCardNumber')}</span>
                  <Input
                    value={settingsDraft.sellerCardNumber}
                    onChange={(e) => {
                      setSettingsDraft(d => ({ ...d, sellerCardNumber: e.target.value.replace(/\D/g, '').slice(0, 19) }))
                      setSettingsError(null)
                      setSettingsSaved(false)
                    }}
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    disabled={working === 'settings'}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{t('sellerCardName')}</span>
                  <Input
                    value={settingsDraft.sellerCardName}
                    onChange={(e) => {
                      setSettingsDraft(d => ({ ...d, sellerCardName: e.target.value }))
                      setSettingsError(null)
                      setSettingsSaved(false)
                    }}
                    placeholder={t('sellerCardNamePlaceholder')}
                    disabled={working === 'settings'}
                  />
                </label>
                {settingsError && (
                  <p className="rounded-lg bg-red/10 px-3 py-2 text-xs text-red">{t(settingsError)}</p>
                )}
                {settingsSaved && (
                  <p className="rounded-lg bg-green/10 px-3 py-2 text-xs text-green">{t('settingsSaved')}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={working === 'settings'} className="gap-1.5">
                    {working === 'settings' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('save')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setSettingsDraft(settings ? { ...settings } : { sellerCardNumber: '', sellerCardName: '' }); setSettingsError(null); setSettingsSaved(false); setEditingSettings(false) }}>
                    {t('cancel')}
                  </Button>
                </div>
              </form>
              ) : (
                <div className="mt-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{t('sellerCardNumber')}</span>
                    <p className="font-mono text-sm text-foreground">{settings?.sellerCardNumber ?? '—'}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{t('sellerCardName')}</span>
                    <p className="text-sm text-foreground">{settings?.sellerCardName ?? '—'}</p>
                  </div>
                  {settingsError && (
                    <p className="rounded-lg bg-red/10 px-3 py-2 text-xs text-red">{t(settingsError)}</p>
                  )}
                  {settingsSaved && (
                    <p className="rounded-lg bg-green/10 px-3 py-2 text-xs text-green">{t('settingsSaved')}</p>
                  )}
                  <div>
                    <Button type="button" variant="outline" onClick={() => { setSettingsDraft(settings ? { ...settings } : { sellerCardNumber: '', sellerCardName: '' }); setSettingsError(null); setSettingsSaved(false); setEditingSettings(true) }}>
                      {t('edit')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {proofDialog && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('viewProof')}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setProofDialog(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setProofDialog(null) }}
          >
            <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-xl bg-background p-4" onClick={e => e.stopPropagation()}>
              <Image src={proofDialog} alt={t('proofLabel')} width={1024} height={1536} unoptimized className="w-full rounded-lg" />
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setProofDialog(null)}>{t('close')}</Button>
              </div>
            </div>
          </div>
        )}

        {confirmRejectId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('rejectConfirmTitle')}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setConfirmRejectId(null)}
            onKeyDown={(e) => { if (e.key === 'Escape') setConfirmRejectId(null) }}
          >
            <div className="w-full max-w-sm rounded-xl bg-background p-5" onClick={e => e.stopPropagation()}>
              <p className="text-sm font-semibold text-foreground">{t('rejectConfirmTitle')}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t('rejectConfirmDesc')}</p>
              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="outline" disabled={working === confirmRejectId} onClick={() => setConfirmRejectId(null)}>
                  {t('cancel')}
                </Button>
                <Button size="sm" variant="destructive" disabled={working === confirmRejectId} onClick={() => void confirmReject()} className="gap-1.5">
                  {working === confirmRejectId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t('rejectConfirmYes')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function OrderCard({ order, acting, onAct, onViewProof }: {
  order: Order
  acting: boolean
  onAct: (id: string, action: 'approve' | 'reject') => Promise<void>
  onViewProof: (url: string) => void
}) {
  const t = useTranslations('admin')
  const status = order.status

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{order.email ?? '—'}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'approved' ? 'default' : status === 'rejected' ? 'secondary' : 'outline'}>
            {status === 'pending' ? t('statusPending') : status === 'approved' ? t('statusApproved') : t('statusRejected')}
          </Badge>
          <span className="text-sm font-bold text-foreground">{formatWon(order.amount)}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-muted/40 p-4 text-xs sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">{t('planMonth')}</p>
          <p className="mt-0.5 text-sm text-foreground">
            {order.plan_month}
            {order.coupon_discount ? ` · ${order.coupon_discount}%` : ''}
            {order.coupons?.code ? ` · ${order.coupons.code}` : ''}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('proofLabel')}</p>
          {order.proofUrl && order.proof_path ? (
            <button
              type="button"
              onClick={() => onViewProof(order.proofUrl!)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {t('viewProof')}
            </button>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">—</p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground">{t('paidAt')}</p>
          <p className="mt-0.5 text-sm text-foreground">
            {order.status === 'approved' && order.approved_at
              ? new Date(order.approved_at).toLocaleString()
              : '—'}
          </p>
        </div>
      </div>

      {status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" disabled={acting} onClick={() => void onAct(order.id, 'approve')} className="gap-1.5">
            {acting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('approve')}
          </Button>
          <Button size="sm" variant="outline" disabled={acting} onClick={() => void onAct(order.id, 'reject')} className="gap-1.5 text-red hover:text-red">
            {t('reject')}
          </Button>
        </div>
      )}
      {order.expires_at && status === 'approved' && (
        <p className="mt-3 text-xs text-muted-foreground">{t('accessGrant', { date: new Date(order.expires_at).toLocaleString() })}</p>
      )}
    </div>
  )
}