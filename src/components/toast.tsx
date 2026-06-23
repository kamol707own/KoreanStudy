'use client'

import { useState } from 'react'
import { Star, Shield, RotateCw } from 'lucide-react'

interface Toast {
  id: number
  message: string
  icon: React.ReactNode
  color: string
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, icon: React.ReactNode, color: string) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, icon, color }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return { toasts, addToast }
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2.5">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right duration-400 fill-mode-forwards"
          style={{ '--tw-enter-translate-x': '120%' } as React.CSSProperties}
        >
          <div
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-lg bg-card border shadow-lg font-semibold text-sm"
            style={{ borderColor: toast.color, color: toast.color }}
          >
            {toast.icon}
            {toast.message}
          </div>
        </div>
      ))}
    </div>
  )
}

export function showXpToast(addToast: (msg: string, icon: React.ReactNode, color: string) => void, xp: number) {
  addToast(`+${xp} XP earned!`, <Star className="w-4 h-4" />, 'var(--color-gold)')
}

export function showLevelUpToast(addToast: (msg: string, icon: React.ReactNode, color: string) => void, level: number) {
  addToast(`Level Up! You are now Level ${level}!`, <Shield className="w-4 h-4" />, 'var(--color-korean)')
}

export function showRemoveXpToast(addToast: (msg: string, icon: React.ReactNode, color: string) => void, xp: number) {
  addToast(`-${xp} XP removed`, <RotateCw className="w-4 h-4" />, 'var(--color-red)')
}