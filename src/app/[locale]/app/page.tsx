/* eslint-disable react-hooks/set-state-in-effect -- mount-time restore of the
   saved theme is intentional (see the same pattern in use-progress.ts) */
'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useAccount } from '@/components/account-provider'
import { Sidebar } from '@/components/sidebar'
import { Dashboard } from '@/components/dashboard'
import { LessonView } from '@/components/lesson-view'
import { VocabularyPanel } from '@/components/vocabulary-panel'
import { ReviewSession } from '@/components/review-session'
import { VocabularyStudy } from '@/components/vocabulary-study'
import { ToastContainer, useToast, showXpToast, showLevelUpToast, showRemoveXpToast } from '@/components/toast'
import { useProgress } from '@/hooks/use-progress'
import { useSrs } from '@/hooks/use-srs'
import { useVocabulary } from '@/hooks/use-vocabulary'
import { units, themes, XP_PER_LESSON } from '@/lib/data'
import { wordsForLesson } from '@/lib/vocabulary'
import { getCardStats, getDueIds } from '@/lib/srs'
import { cn } from '@/lib/utils'
import { applyTheme } from '@/lib/theme'

type View = 'dashboard' | 'lesson' | 'vocabulary' | 'vocabStudy' | 'review'

interface LessonState {
  unit: string
  num: number | string
  title: string
}

type ReviewTarget =
  | { type: 'landing' }
  | { type: 'due' }
  | ({ type: 'lesson' } & LessonState)

/**
 * The whole navigation state lives in the URL as a query param
 *   /?l=unit2/34        — lesson 34 of unit 2
 *   /?l=themes/school   — the "school" theme lesson
 *   /?v=vocab           — vocabulary panel
 *   /?r=review          — vocabulary study section (deck stats + start)
 *   /?r=due             — review session of every word due today
 *   /?r=unit2/34        — review of one lesson's words
 *   (no params)         — dashboard
 * so a full page load (refresh, deploy, locale switch) always restores the
 * exact view the user was on instead of dropping back to the dashboard.
 */
const LESSON_PARAM = 'l'
const VOCAB_PARAM = 'v'
const REVIEW_PARAM = 'r'

function parseLessonParam(raw: string | null): LessonState | null {
  if (!raw) return null
  const slash = raw.indexOf('/')
  if (slash <= 0 || slash === raw.length - 1) return null
  const unit = raw.slice(0, slash)
  const numRaw = raw.slice(slash + 1)

  if (unit === 'themes') {
    const theme = themes.find(th => th.id === numRaw)
    return theme ? { unit, num: theme.id, title: theme.title } : null
  }

  const num = Number(numRaw)
  if (!Number.isInteger(num)) return null
  const lesson = units.find(u => u.id === unit)?.lessons.find(l => l.id === num)
  return lesson ? { unit, num, title: lesson.title } : null
}

function parseReviewParam(raw: string | null): ReviewTarget | null {
  if (!raw) return null
  if (raw === 'review') return { type: 'landing' }
  if (raw === 'due') return { type: 'due' }
  const lesson = parseLessonParam(raw)
  return lesson ? { type: 'lesson', ...lesson } : null
}

function lessonToParam(lesson: LessonState): string {
  return `${lesson.unit}/${lesson.num}`
}

function Home() {
  const tCommon = useTranslations('common')
  const tToast = useTranslations('toast')
  const router = useRouter()
  const { user, isAdmin, authReady, subscription, subscriptionLoaded } = useAccount()

  // Paywall: the app is only reachable when signed in AND access is active
  // (admins bypass the paywall). Signed-out visitors are sent to the landing page.
  const blocked = authReady && (!user || (!isAdmin && subscriptionLoaded && !subscription?.hasAccess))
  useEffect(() => {
    if (blocked) router.replace('/')
  }, [blocked, router])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [remountKey, setRemountKey] = useState(0)

  const progress = useProgress()
  const srs = useSrs()
  const vocab = useVocabulary()
  const { toasts, addToast } = useToast()

  // --- Navigation state, derived from the URL -------------------------------
  const searchParams = useSearchParams()
  // Real path (includes the /zh-style locale prefix) so param updates never
  // drop the locale from the address bar.
  const pathname = usePathname()
  const currentLesson = useMemo(
    () => parseLessonParam(searchParams.get(LESSON_PARAM)),
    [searchParams]
  )
  const reviewTarget = useMemo(
    () => parseReviewParam(searchParams.get(REVIEW_PARAM)),
    [searchParams]
  )
  const vocabOpen = searchParams.get(VOCAB_PARAM) === 'vocab'
  const view: View = reviewTarget
    ? reviewTarget.type === 'landing'
      ? 'vocabStudy'
      : 'review'
    : vocabOpen
      ? 'vocabulary'
      : currentLesson
        ? 'lesson'
        : 'dashboard'

  const dueToday = useMemo(() => getCardStats(srs.cards).dueToday, [srs.cards])

  // Words for the current lesson, used for the review button and auto-add.
  const currentLessonWordCount = useMemo(() => {
    if (!currentLesson) return 0
    return wordsForLesson(vocab.vocabulary, currentLesson.unit, currentLesson.num).length
  }, [currentLesson, vocab.vocabulary])

  const reviewCardIds = useMemo(() => {
    if (!reviewTarget || reviewTarget.type === 'landing') return []
    if (reviewTarget.type === 'due') return getDueIds(srs.cards)
    return wordsForLesson(vocab.vocabulary, reviewTarget.unit, reviewTarget.num).map(w => w.id)
  }, [reviewTarget, srs.cards, vocab.vocabulary])

  // Update the URL without a server round-trip (Next.js syncs
  // useSearchParams with the history API) so lesson clicks feel instant,
  // while still surviving refreshes and redeploys.
  const pushParams = useCallback((lesson: LessonState | null, vocab: boolean, review?: string | null) => {
    const params = new URLSearchParams(window.location.search)
    params.delete(LESSON_PARAM)
    params.delete(VOCAB_PARAM)
    params.delete(REVIEW_PARAM)
    if (review) params.set(REVIEW_PARAM, review)
    else if (vocab) params.set(VOCAB_PARAM, 'vocab')
    else if (lesson) params.set(LESSON_PARAM, lessonToParam(lesson))
    const qs = params.toString()
    window.history.pushState(null, '', qs ? `${pathname}?${qs}` : pathname)
  }, [pathname])

  useEffect(() => {
    // The server rendered <html data-theme> from the theme cookie, so read the
    // applied value back from the DOM rather than re-deriving it.
    let applied = document.documentElement.getAttribute('data-theme')

    // One-time migration: users whose theme was saved by an earlier build
    // (localStorage, before the cookie existed) get it copied into the cookie
    // so subsequent loads render the right theme on the server.
    if (!document.cookie.includes('korean-study-theme=')) {
      try {
        const legacy = localStorage.getItem('korean-study-theme')
        if (legacy === 'light' || legacy === 'dark') {
          applied = legacy
          applyTheme(legacy)
        }
      } catch {}
    }

    if (applied === 'light' || applied === 'dark') setTheme(applied)

    // Safety net for back/forward navigation: the URL is the source of truth,
    // so a remount on popstate guarantees the view matches it even if the
    // framework's own history sync misses an edge case.
    const syncFromUrl = () => setRemountKey(k => k + 1)
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  // Instant theme swap: flip the CSS variables on <html> and keep React in
  // sync. No view transition, no cross-fade — every element resolves its new
  // colors on the same frame, so nothing lags, flashes, or draws a contrast
  // line while the rest of the page has already switched.
  const toggleTheme = useCallback(() => {
    // The live `data-theme` attribute is the single source of truth, so a
    // burst of clicks can never compute the next theme from a stale React
    // value — that stale read was what made dark→light→dark glitch.
    const currentTheme = (): 'light' | 'dark' =>
      document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'

    const next = currentTheme() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }, [])

  const handleGoHome = useCallback(() => {
    pushParams(null, false)
    window.scrollTo(0, 0)
  }, [pushParams])

  const handleSelectLesson = useCallback((unitId: string, num: number | string, title: string) => {
    pushParams({ unit: unitId, num, title }, false)
    window.scrollTo(0, 0)
  }, [pushParams])

  const handleSelectTheme = useCallback((themeId: string, title: string) => {
    pushParams({ unit: 'themes', num: themeId, title }, false)
    window.scrollTo(0, 0)
  }, [pushParams])

  const handleBack = useCallback(() => {
    pushParams(null, false)
    window.scrollTo(0, 0)
  }, [pushParams])

  const handleGoToVocabulary = useCallback(() => {
    pushParams(null, true)
    window.scrollTo(0, 0)
  }, [pushParams])

  const handleGoToReview = useCallback(() => {
    pushParams(null, false, 'review')
    window.scrollTo(0, 0)
  }, [pushParams])

  const handleStartDueReview = useCallback(() => {
    pushParams(null, false, 'due')
    window.scrollTo(0, 0)
  }, [pushParams])

  /** Leave a review session: lesson sessions go home, due sessions return to
   *  the vocabulary study section. */
  const handleExitReview = useCallback(() => {
    pushParams(null, false, reviewTarget?.type === 'lesson' ? null : 'review')
    window.scrollTo(0, 0)
  }, [pushParams, reviewTarget])

  const handleReviewLesson = useCallback((unitId: string, num: number | string) => {
    pushParams({ unit: unitId, num, title: '' }, false, `${unitId}/${num}`)
    window.scrollTo(0, 0)
  }, [pushParams])

  const handleComplete = useCallback(() => {
    if (!currentLesson) return
    const result = progress.markComplete(currentLesson.unit, currentLesson.num)
    if (result.action === 'marked') {
      // Finishing a lesson seeds its vocabulary into the spaced-repetition deck.
      const lessonWords = wordsForLesson(vocab.vocabulary, currentLesson.unit, currentLesson.num)
      if (lessonWords.length > 0) srs.addWords(lessonWords.map(w => w.id))
      showXpToast(addToast, tToast, XP_PER_LESSON)
      if (result.leveledUp) {
        setTimeout(() => showLevelUpToast(addToast, tToast, result.newLevel!), 500)
      }
    } else {
      showRemoveXpToast(addToast, tToast, XP_PER_LESSON)
    }
  }, [currentLesson, progress, srs, vocab.vocabulary, addToast, tToast])

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

  const { prev, next } = getNavLessons()
  const mainMargin = sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'

  // Wait for auth + subscription before revealing anything; the redirect
  // effect above sends blocked users back to the landing page.
  if (!authReady || !subscriptionLoaded || (!isAdmin && !subscription?.hasAccess)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
        <div className="w-5 h-5 border-2 border-border border-t-korean rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div key={remountKey} className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentLesson={currentLesson}
        onSelectLesson={handleSelectLesson}
        onSelectTheme={handleSelectTheme}
        onGoHome={handleGoHome}
        onGoToVocabulary={handleGoToVocabulary}
        onGoToReview={handleGoToReview}
        reviewDue={dueToday}
        isCompleted={progress.isCompleted}
        getUnitCompletedCount={progress.getUnitCompletedCount}
        mobileNavOpen={mobileNavOpen}
        onMobileNavChange={setMobileNavOpen}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className={cn("min-h-screen relative z-10", mainMargin)}>
        <div className="px-4 pb-20 pt-16 sm:px-6 md:px-7 lg:pt-7 flex justify-center">
          <div className="w-full max-w-[800px]">
            {!progress.mounted || !srs.mounted ? (
              <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">
                {tCommon('loading')}
              </div>
            ) : view === 'vocabStudy' ? (
              <VocabularyStudy
                dueToday={dueToday}
                srsCards={srs.cards}
                onStartReview={handleStartDueReview}
                onAddWords={handleGoToVocabulary}
              />
            ) : view === 'review' ? (
              vocab.ready ? (
                <ReviewSession
                  cardIds={reviewCardIds}
                  onExit={handleExitReview}
                  srs={srs}
                  vocabulary={vocab.vocabulary}
                  zhDict={vocab.zhDict}
                />
              ) : (
                <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">
                  {tCommon('loading')}
                </div>
              )
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
                dueToday={dueToday}
                reviewActivity={srs.activity}
                onStartReview={handleGoToReview}
              />
            ) : view === 'vocabulary' ? (
              <VocabularyPanel
                onSelectLesson={handleSelectLesson}
                onSelectTheme={handleSelectTheme}
              />
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
                lessonWordCount={currentLessonWordCount}
                onReviewLesson={handleReviewLesson}
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

export default function HomePage() {
  return (
    // useSearchParams requires a Suspense boundary under prerendering.
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
          <div className="w-5 h-5 border-2 border-border border-t-korean rounded-full animate-spin" />
        </div>
      }
    >
      <Home />
    </Suspense>
  )
}
