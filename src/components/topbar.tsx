'use client'

import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

interface TopbarProps {
  title: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Topbar({ title, theme, onToggleTheme }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-end backdrop-blur-xl bg-background/60 border-b border-border">
      <Button variant="ghost" size="icon" onClick={onToggleTheme}>
        {theme === 'dark' ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
      </Button>
    </header>
  )
}