'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Share } from 'lucide-react'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface InstallAppButtonProps {
  /** Renders a compact icon-only button (sidebar rail / landing nav). */
  iconOnly?: boolean
  className?: string
}

/**
 * "Install as an app" entry point. Shows the native install dialog on
 * Chromium/Android, an "Add to Home Screen" hint dialog on iOS Safari, and
 * renders nothing once the app is installed or on unsupported browsers.
 */
export function InstallAppButton({ iconOnly = false, className }: InstallAppButtonProps) {
  const t = useTranslations('install')
  const { canInstall, isIOS, promptInstall } = usePwaInstall()
  const [iosOpen, setIosOpen] = useState(false)

  if (!canInstall && !isIOS) return null

  const handleClick = () => {
    if (canInstall) void promptInstall()
    else if (isIOS) setIosOpen(true)
  }

  const label = t('installApp')

  if (iconOnly) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          title={label}
          onClick={handleClick}
          className={cn('h-9 w-9 text-muted-foreground hover:text-foreground', className)}
        >
          <Download className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Button>
        <InstallHintDialog open={iosOpen} onOpenChange={setIosOpen} />
      </>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className={cn(
          'flex h-9 w-full items-center justify-start gap-2 border-border/60 bg-card/60 px-2.5 text-xs font-medium shadow-xs hover:bg-card',
          className
        )}
      >
        <Download className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <span className="min-w-0 truncate">{label}</span>
      </Button>
      <InstallHintDialog open={iosOpen} onOpenChange={setIosOpen} />
    </>
  )
}

/** Shared iOS "Add to Home Screen" instructions dialog. */
function InstallHintDialog({
  open, onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('install')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('iosTitle')}</DialogTitle>
          <DialogDescription>{t('iosBody')}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
          <Share className="h-5 w-5 shrink-0 text-korean" strokeWidth={1.5} />
          <span>{t('iosSteps')}</span>
        </div>
        <DialogClose asChild>
          <Button className="w-full">{t('gotIt')}</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}