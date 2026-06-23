'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Dashboard } from '@/components/dashboard'
import { LessonView } from '@/components/lesson-view'
import { VocabularyPanel } from '@/components/vocabulary-panel'
import { Topbar } from '@/components/topbar'
import { ToastContainer, useToast, showXpToast, showLevelUpToast, showRemoveXpToast } from '@/components/toast'
import { useProgress } from '@/hooks/use-progress'
import { units, themes, XP_PER_LESSON } from '@/lib/data'
import { cn } from '@/lib/utils'

type View = 'dashboard' | 'lesson' | 'theme' | 'vocabulary'

interface LessonState {
  unit: string
  num: number | string
  title: string
}

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const [currentLesson, setCurrentLesson] = useState<LessonState | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  const progress = useProgress()
  const { toasts, addToast } = useToast()

  useEffect(() => {
    const saved = localStorage.getItem('korean-study-theme') as 'light' | 'dark' | null
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('korean-study-theme', next)
  }, [theme])

  const handleGoHome = useCallback(() => {
    setView('dashboard')
    setCurrentLesson(null)
  }, [])

  const handleSelectLesson = useCallback((unitId: string, num: number | string, title: string) => {
    setCurrentLesson({ unit: unitId, num, title })
    setView('lesson')
    window.scrollTo(0, 0)
  }, [])

  const handleSelectTheme = useCallback((themeId: string, title: string) => {
    setCurrentLesson({ unit: 'themes', num: themeId, title })
    setView('lesson')
    window.scrollTo(0, 0)
  }, [])

  const handleBack = useCallback(() => {
    setView('dashboard')
    setCurrentLesson(null)
  }, [])

  const handleComplete = useCallback(() => {
    if (!currentLesson) return
    const result = progress.markComplete(currentLesson.unit, currentLesson.num)
    if (result.action === 'marked') {
      showXpToast(addToast, XP_PER_LESSON)
      if (result.leveledUp) {
        setTimeout(() => showLevelUpToast(addToast, result.newLevel!), 500)
      }
    } else {
      showRemoveXpToast(addToast, XP_PER_LESSON)
    }
  }, [currentLesson, progress, addToast])

  const getNavLessons = useCallback(() => {
    if (!currentLesson) return { prev: null, next: null }

    if (currentLesson.unit === 'themes') {
      const themeIdx = themes.findIndex(t => t.id === currentLesson.num)
      const prev = themeIdx > 0 ? { unitId: 'themes', num: themes[themeIdx - 1].id, title: themes[themeIdx - 1].title } : null
      const next = themeIdx < themes.length - 1 ? { unitId: 'themes', num: themes[themeIdx + 1].id, title: themes[themeIdx + 1].title } : null
      return { prev, next }
    }

    const unitIdx = units.findIndex(u => u.id === currentLesson.unit)
    const unit = units[unitIdx]
    const lessonIdx = unit?.lessons.findIndex(l => l.id === currentLesson.num) ?? -1

    let prev = null
    if (lessonIdx > 0) {
      const pl = unit.lessons[lessonIdx - 1]
      prev = { unitId: unit.id, num: pl.id, title: pl.title }
    } else if (unitIdx > 0) {
      const pu = units[unitIdx - 1]
      const pl = pu.lessons[pu.lessons.length - 1]
      prev = { unitId: pu.id, num: pl.id, title: pl.title }
    }

    let next = null
    if (lessonIdx < (unit?.lessons.length ?? 0) - 1) {
      const nl = unit!.lessons[lessonIdx + 1]
      next = { unitId: unit!.id, num: nl.id, title: nl.title }
    } else if (unitIdx < units.length - 1) {
      const nu = units[unitIdx + 1]
      const nl = nu.lessons[0]
      next = { unitId: nu.id, num: nl.id, title: nl.title }
    }

    return { prev, next }
  }, [currentLesson])

  const pageTitle = view === 'dashboard'
    ? 'Dashboard'
    : view === 'vocabulary'
      ? 'Vocabulary'
      : currentLesson
        ? `Lesson ${currentLesson.num}: ${currentLesson.title}`
        : 'Dashboard'

  const { prev, next } = getNavLessons()
  const mainMargin = sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[280px]'

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentLesson={currentLesson}
        onSelectLesson={handleSelectLesson}
        onSelectTheme={handleSelectTheme}
        onGoHome={handleGoHome}
        onGoToVocabulary={() => setView('vocabulary')}
        isCompleted={progress.isCompleted}
        getUnitCompletedCount={progress.getUnitCompletedCount}
      />

      <main className={cn("min-h-screen relative z-10 transition-all duration-300", mainMargin)}>
        <Topbar
          title={pageTitle}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="p-4 sm:p-6 md:p-7 pb-20 flex justify-center">
          <div className="w-full max-w-[800px]">
            {!progress.mounted ? (
              <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">
                Loading...
              </div>
            ) : view === 'dashboard' ? (
              <Dashboard
                streak={progress.streak}
                totalXp={progress.totalXp}
                level={progress.level}
                xpInLevel={progress.xpInLevel}
                completedCount={progress.completedCount}
                overallPct={progress.overallPct}
                getUnitCompletedCount={progress.getUnitCompletedCount}
                getNextLesson={progress.getNextLesson}
                onSelectLesson={handleSelectLesson}
                onSelectTheme={handleSelectTheme}
                getHeatmapData={progress.getHeatmapData}
                getStreakStats={progress.getStreakStats}
              />
            ) : view === 'vocabulary' ? (
              <VocabularyPanel />
            ) : currentLesson ? (
              <LessonView
                unitId={currentLesson.unit}
                num={currentLesson.num}
                title={currentLesson.title}
                isCompleted={progress.isCompleted(currentLesson.unit, currentLesson.num)}
                totalXp={progress.totalXp}
                level={progress.level}
                onComplete={handleComplete}
                onBack={handleBack}
                onNavigate={handleSelectLesson}
                prevLesson={prev}
                nextLesson={next}
              />
            ) : null}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  )
}