'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Loader2, LogOut, UserRound, Trash2, Camera, Pencil, Check,
} from 'lucide-react'
import { useAccount } from '@/components/account-provider'
import { useAppLocale } from '@/i18n/use-app-locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { SyncStatus } from '@/lib/sync/client'

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const t = useTranslations('sync')
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <span
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          status === 'synced' ? 'bg-green' :
          status === 'syncing' ? 'bg-amber-500 animate-pulse' :
          status === 'disabled' ? 'bg-muted-foreground/40' : 'bg-red-400'
        )}
      />
      <span>
        {status === 'synced' && t('synced')}
        {status === 'syncing' && t('syncing')}
        {status === 'offline' && t('offline')}
        {status === 'error' && t('error')}
        {status === 'disabled' && t('disabled')}
        {status === 'loading' && t('loading')}
      </span>
    </div>
  )
}

function DeleteAccountDialog({
  open,
  onOpenChange,
  userEmail,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
}) {
  const t = useTranslations('auth')
  const { deleteAccount, busy } = useAccount()
  const [confirmEmail, setConfirmEmail] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const emailMatches = confirmEmail.trim() === userEmail

  const handleDelete = async () => {
    if (!emailMatches || busy === 'delete') return
    setErrorKey(null)
    const result = await deleteAccount()
    if (!result.ok) setErrorKey(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red">{t('deleteAccount')}</DialogTitle>
          <DialogDescription>
            {t('deleteAccountConfirm')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="rounded-lg bg-red/10 px-3 py-2 text-xs leading-relaxed text-red">
            {t('deleteAccountWarning')}
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {t('deleteAccountEmailHint', { email: userEmail })}
            </span>
            <Input
              type="email"
              value={confirmEmail}
              onChange={(e) => {
                setConfirmEmail(e.target.value)
                setErrorKey(null)
              }}
              placeholder={userEmail}
              autoComplete="off"
            />
          </label>
          {errorKey && (
            <p className="rounded-lg bg-red/10 px-3 py-2 text-xs text-red">
              {t(errorKey)}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleDelete()}
              disabled={!emailMatches || busy === 'delete'}
            >
              {busy === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('deleteAccount')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AuthSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('auth')
  const locale = useAppLocale()
  const { user, authReady, busy, status, signIn, signUp, signOut, updateAvatar, removeAvatar, updateProfile } = useAccount()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setErrorKey(null)
    const result = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)
    if (!result.ok) setErrorKey(result.error)
  }

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next)
    setErrorKey(null)
  }

  const startEditing = () => {
    setDraftName(user?.name ?? '')
    setErrorKey(null)
    setEditing(true)
  }

  const saveProfile = async () => {
    if (busy) return
    setErrorKey(null)
    const result = await updateProfile(draftName)
    if (!result.ok) {
      setErrorKey(result.error)
      return
    }
    setEditing(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setErrorKey(null)
    const result = await updateAvatar(file)
    if (!result.ok) setErrorKey(result.error)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveAvatar = async () => {
    if (!user) return
    setErrorKey(null)
    const result = await removeAvatar()
    if (!result.ok) setErrorKey(result.error)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader className="mb-4 pr-8">
            <SheetTitle>{t('account')}</SheetTitle>
            <SheetDescription>
              {user ? t('signedInDescription') : t('signedOutHint')}
            </SheetDescription>
          </SheetHeader>

          {!authReady ? (
            <div className="flex h-28 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : user ? (
            <div className="flex flex-col gap-4">
              {/* Profile header */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="relative">
                  <div className="flex h-16 w-16 overflow-hidden rounded-full bg-korean/15 text-korean ring-2 ring-border/60">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.name || user.email}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  {busy === 'avatar' && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                      <Loader2 className="h-5 w-5 animate-spin text-korean" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.name ? user.email : t('signedInAs')}
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleFileChange(e)}
                />

                {editing ? (
                  <div className="flex w-full flex-col gap-2 pt-1">
                    <label className="flex flex-col items-start gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">{t('profileName')}</span>
                      <Input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder={t('profileNamePlaceholder')}
                        maxLength={50}
                        autoFocus
                      />
                    </label>
                    {errorKey && (
                      <p className="w-full rounded-lg bg-red/10 px-3 py-2 text-xs text-red">
                        {t(errorKey)}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={busy === 'avatar'}
                        onClick={() => void saveProfile()}
                      >
                        {busy === 'avatar' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {t('save')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy === 'avatar'}
                        onClick={() => { setEditing(false); setErrorKey(null) }}
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        disabled={busy === 'avatar'}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {t('uploadPhoto')}
                      </Button>
                      {user.avatarUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground"
                          disabled={busy === 'avatar'}
                          onClick={() => void handleRemoveAvatar()}
                        >
                          {t('removePhoto')}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={startEditing}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('editProfile')}
                  </Button>
                )}
              </div>

              <SyncStatusBadge status={status} />

              <Button
                variant="outline"
                onClick={() => void signOut()}
                disabled={busy === 'signout'}
                className="mt-1 w-full"
              >
                {busy === 'signout'
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <LogOut className="h-4 w-4" />}
                {t('signOut')}
              </Button>

              {/* Danger Zone */}
              <div className="mt-2 border-t border-border/60 pt-4">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-red hover:bg-red/10 hover:text-red"
                    onClick={() => setDeleteOpen(true)}
                    disabled={busy !== null}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('deleteAccount')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3">
              <div className="flex gap-1 rounded-lg bg-muted/60 p-1">
                {(['signin', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={cn(
                      'h-8 flex-1 rounded-md text-xs font-medium transition-colors',
                      mode === m
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {m === 'signin' ? t('signIn') : t('signUp')}
                  </button>
                ))}
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t('email')}</span>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={locale === 'zh' ? '邮箱' : 'you@example.com'}
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t('password')}</span>
                <Input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </label>

              {errorKey && (
                <p className="rounded-lg bg-red/10 px-3 py-2 text-xs text-red">
                  {t(errorKey)}
                </p>
              )}

              <Button type="submit" disabled={busy !== null} className="w-full">
                {busy !== null && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signin' ? t('signIn') : t('signUp')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin' ? t('switchToSignUp') : t('switchToSignIn')}
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
      {user && (
        <DeleteAccountDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          userEmail={user.email}
        />
      )}
    </>
  )
}

export { SyncStatusBadge }