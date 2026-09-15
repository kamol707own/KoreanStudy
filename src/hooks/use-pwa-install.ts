'use client'

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Installability state for a PWA. Chrome/Edge/Android expose a captured
 * `beforeinstallprompt` event; iOS Safari has no event, so we fall back to a
 * "Add to Home Screen" hint (`isIOS`). Once installed or running standalone
 * the buttons should hide (`installed`).
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    )
  })

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
    return true
  }, [deferredPrompt])

  return {
    /** True when the native install prompt is available to show. */
    canInstall: !installed && !!deferredPrompt,
    /** True on iOS Safari (no native prompt — show a "Add to Home Screen" hint). */
    isIOS: isIOSDevice() && !installed,
    /** True once the app is installed / running standalone. */
    installed,
    promptInstall,
  }
}