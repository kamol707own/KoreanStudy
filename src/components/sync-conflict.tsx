'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CloudUpload, Laptop, Merge } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { SyncResolution, SyncVerdict } from '@/lib/sync/sync-core'

type ConflictVerdict = Extract<SyncVerdict, { kind: 'conflict' }>

const OPTIONS: { key: SyncResolution; icon: typeof CloudUpload; descKey: string }[] = [
  { key: 'cloud', icon: CloudUpload, descKey: 'useCloudDesc' },
  { key: 'device', icon: Laptop, descKey: 'useDeviceDesc' },
  { key: 'merge', icon: Merge, descKey: 'mergeDesc' },
]

/**
 * Shown when this device's copy and the cloud copy of the same data diverge.
 * One table at a time (progress, then flashcards) — each instance owns its own
 * dismiss state so closing one never dimisses the other. The chosen data is
 * written to both the local copy and the cloud row.
 */
export function SyncConflictDialog({
  conflicts,
  onResolve,
}: {
  conflicts: ConflictVerdict[]
  onResolve: (verdict: ConflictVerdict, resolution: SyncResolution) => void
}) {
  const current = conflicts[0]
  if (!current) return null

  return (
    <ConflictCard
      key={current.table}
      verdict={current}
      hasMore={conflicts.length > 1}
      onResolve={onResolve}
    />
  )
}

function ConflictCard({
  verdict,
  hasMore,
  onResolve,
}: {
  verdict: ConflictVerdict
  hasMore: boolean
  onResolve: (verdict: ConflictVerdict, resolution: SyncResolution) => void
}) {
  const t = useTranslations('sync')
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <Dialog open onOpenChange={(open) => { if (!open) setDismissed(true) }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('conflictTitle')}</DialogTitle>
          <DialogDescription>
            {verdict.table === 'progress' ? t('conflictProgress') : t('conflictSrs')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-1 flex flex-col gap-2">
          {OPTIONS.map(({ key, icon: Icon, descKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => onResolve(verdict, key)}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 text-left transition-colors hover:border-korean/40 hover:bg-card active:scale-[0.99]"
            >
              <Icon className="h-4 w-4 shrink-0 text-korean" />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{t(`opt_${key}`)}</span>
                <span className="text-xs text-muted-foreground">{t(descKey)}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {hasMore ? t('conflictNext') : '\u00A0'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            {t('skipForNow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}