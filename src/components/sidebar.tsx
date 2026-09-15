'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useAppLocale } from '@/i18n/use-app-locale'
import { usePathname, useRouter } from '@/i18n/navigation'
import { locales, type AppLocale } from '@/i18n/routing'
import { localizedLessonTitle, localizedThemeTitle } from '@/lib/i18n/content'
import { cn } from '@/lib/utils'
import { units, themes, getTotalLessons } from '@/lib/data'
import type { VocabularyWord } from '@/lib/vocabulary'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { SearchBox } from '@/components/search-box'
import { useAccount } from '@/components/account-provider'
import { InstallAppButton } from '@/components/install-app-button'
import { getSiteIndex, loadVocabularyData, loadZhDict } from '@/lib/site-search'
import type { SyncStatus } from '@/lib/sync/client'
import {
  BookOpen, Languages, MessageSquare, GraduationCap, FlaskConical,
  Brain, Sparkles, Trophy, School, Bus, UtensilsCrossed, ShoppingBag,
  CloudSun, ChevronRight, Check, PanelLeftClose, PanelLeftOpen,
  Home, BookMarked, Menu, Moon, Sun, UserRound, ShieldCheck
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Languages, MessageSquare, GraduationCap, FlaskConical,
  Brain, Sparkles, Trophy, School, Bus, UtensilsCrossed, ShoppingBag, CloudSun
}

interface SidebarProps {
  currentLesson: { unit: string; num: number | string } | null
  onSelectLesson: (unitId: string, num: number | string, title: string) => void
  onSelectTheme: (themeId: string, title: string) => void
  onGoHome: () => void
  onGoToVocabulary?: () => void
  onGoToReview?: () => void
  /** Number of words due today, shown on the Learn Vocabulary row (0 hides it). */
  reviewDue?: number
  isCompleted: (unitId: string, lessonNum: number | string) => boolean
  getUnitCompletedCount: (unitId: string) => number
  isCollapsed: boolean
  onToggleCollapse: () => void
  /** Theme + language controls live in the sidebar footer (the topbar was removed). */
  theme: 'light' | 'dark'
  onToggleTheme: (e?: React.MouseEvent) => void
  /** Controlled open state of the mobile sheet, opened by the floating menu button. */
  mobileNavOpen?: boolean
  onMobileNavChange?: (open: boolean) => void
}

type IconType = LucideIcon

/** Shared visual language for nav rows (icon rail, rounded hover, 13px type). */
function NavRow({
  icon: Icon, label, title, onClick, active, done, right
}: {
  icon?: IconType
  label: string
  title?: string
  onClick: () => void
  active?: boolean
  done?: boolean
  right?: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={cn(
        'group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-[6px] px-2.5 py-[7px] text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
        active
          ? 'bg-black/5 font-medium text-foreground dark:bg-white/10'
          : 'text-muted-foreground hover:bg-black/5 hover:text-foreground/90 dark:hover:bg-white/5'
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground/70'
            )}
            strokeWidth={1.5}
          />
        )}
        <span className="truncate text-[13px] tracking-wide">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {right}
        {done && <Check className="h-3 w-3 text-green" strokeWidth={2.5} />}
      </span>
    </button>
  )
}

/** Expandable parent row with animated reveal for its children. */
function Expandable({
  icon: Icon, label, open, onToggle, meta, children
}: {
  icon: IconType
  label: string
  open: boolean
  onToggle: () => void
  meta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full flex-col">
      <button
        type="button"
        title={label}
        onClick={onToggle}
        className={cn(
          'group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-[6px] px-2.5 py-[7px] text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
          open
            ? 'bg-black/5 font-medium text-foreground dark:bg-white/10'
            : 'text-muted-foreground hover:bg-black/5 hover:text-foreground/90 dark:hover:bg-white/5'
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              open ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground/70'
            )}
            strokeWidth={1.5}
          />
          <span className="truncate text-[13px] tracking-wide">{label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {meta}
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200',
              open && 'rotate-90'
            )}
            strokeWidth={2}
          />
        </span>
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="ml-[17px] mt-0.5 flex flex-col gap-0.5 border-l border-black/5 pl-2 dark:border-white/5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
      {children}
    </span>
  )
}

const LANGUAGE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  zh: '中文',
}

/**
 * Theme toggle + language switcher, relocated from the removed topbar.
 * `collapsed` renders an icon-only pair for the 68px rail; the expanded form
 * shows a full-width language <Select> alongside the theme button.
 */
function SidebarControls({
  theme, onToggleTheme, collapsed = false,
}: {
  theme: 'light' | 'dark'
  onToggleTheme: (e?: React.MouseEvent) => void
  collapsed?: boolean
}) {
  const locale = useAppLocale()
  const router = useRouter()
  const pathname = usePathname()

  // Locale switch keeps the current path AND query params (?l=unit2/34 or
  // ?v=vocab) — the view lives in the URL, so dropping the params would send
  // the user back to the dashboard on every language change.
  const handleLocaleChange = (next: string) => {
    const query: Record<string, string> = {}
    new URLSearchParams(window.location.search).forEach((value, key) => {
      query[key] = value
    })
    router.replace({ pathname, query }, { locale: next as AppLocale })
  }

  const themeToggle = (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleTheme}
      aria-label="Toggle theme"
      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/60 bg-card/60 shadow-xs hover:border-korean/40 hover:bg-card active:scale-90"
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 text-amber-500 dark:text-amber-400",
          theme === 'dark' ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 text-slate-700 dark:text-slate-300",
          theme === 'dark' ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
    </Button>
  )

  if (collapsed) {
    const nextLocale: AppLocale = locale === 'en' ? 'zh' : 'en'
    return (
      <>
        {themeToggle}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => handleLocaleChange(nextLocale)}
          title={LANGUAGE_LABELS[nextLocale]}
          aria-label="Language"
        >
          <Languages className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Button>
      </>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger
          aria-label="Language"
          className="h-9 min-w-[110px] flex-1 gap-2 border-border/60 bg-card/60 text-xs font-medium"
        >
          <Languages className="h-[14px] w-[14px] shrink-0 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {LANGUAGE_LABELS[loc]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {themeToggle}
    </div>
  )
}

/**
 * Account entry point — opens the sign-in sheet (or shows the account when
 * signed in). The little corner dot reflects sync state.
 */
function AccountButton({ collapsed = false }: { collapsed?: boolean }) {
  const { user, authReady, openAuth, status } = useAccount()
  const t = useTranslations('auth')

  const label = user ? (user.name || user.email) : (authReady ? t('signIn') : '…')

  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={openAuth}
        title={label}
        aria-label={label}
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        {user?.avatarUrl ? (
          <span className="relative flex h-full w-full items-center justify-center">
            <Image
              src={user.avatarUrl}
              alt={label}
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 overflow-hidden rounded-full object-cover"
            />
            <StatusDot status={status} />
          </span>
        ) : (
          <span className="relative">
            <UserRound className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <StatusDot status={status} />
          </span>
        )}
      </Button>
    )
  }

  return (
    <Button
      onClick={openAuth}
      className="mb-2 flex h-9 w-full items-center justify-start gap-2 border-border/60 bg-card/60 px-2.5 shadow-xs hover:bg-card"
      variant="outline"
    >
      {user?.avatarUrl ? (
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <Image
            src={user.avatarUrl}
            alt={label}
            width={20}
            height={20}
            unoptimized
            className="h-5 w-5 overflow-hidden rounded-full object-cover"
          />
          <StatusDot status={status} />
        </span>
      ) : (
        <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          <UserRound className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <StatusDot status={status} />
        </span>
      )}
      <span className="min-w-0 truncate text-xs font-medium text-foreground">{label}</span>
    </Button>
  )
}

function StatusDot({ status }: { status: SyncStatus }) {
  if (status !== 'synced' && status !== 'syncing' && status !== 'offline') return null
  return (
    <span
      className={cn(
        'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-background',
        status === 'synced' ? 'bg-green' :
        status === 'syncing' ? 'bg-amber-500 animate-pulse' :
        'bg-red-400'
      )}
    />
  )
}

type SidebarContentProps = Omit<SidebarProps, 'isCollapsed'> & {
  onNavigate?: () => void
  showCollapse: boolean
  onToggleCollapse: () => void
}

function SidebarContent({
  currentLesson, onSelectLesson, onSelectTheme, onGoHome, onGoToVocabulary,
  onGoToReview, reviewDue, isCompleted, getUnitCompletedCount, onNavigate,
  showCollapse, onToggleCollapse, theme, onToggleTheme
}: SidebarContentProps) {
  const locale = useAppLocale()
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tDash = useTranslations('dash')
  const tSearch = useTranslations('search')
  const isAdmin = useAccount().isAdmin
  const [search, setSearch] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  // The sidebar starts with a course-only index (lessons + themes, no fetch).
  // Focusing the box upgrades it to the full word index lazily, so word
  // results show up without paying for the vocabulary fetch on every load.
  const [searchIndex, setSearchIndex] = useState(() =>
    getSiteIndex({ locale, vocabulary: [], withWords: false })
  )
  const [searchFullLoaded, setSearchFullLoaded] = useState(false)

  const query = search.trim().toLowerCase()
  const queryActive = query.length > 0
  const matchUnitName = (text: string) => !query || text.toLowerCase().includes(query)

  const lessonHits = queryActive ? searchIndex.matchAll(query, ['lesson']) : []
  const themeHits = queryActive ? searchIndex.matchAll(query, ['theme']) : []
  const lessonHitIds = new Set(lessonHits.map((h) => h.doc.id))
  const themeHitIds = new Set(themeHits.map((h) => h.doc.id))
  const anyCourseHit = lessonHits.length + themeHits.length > 0

  const lessonLabel = (unitId: string, lesson: { id: number | string; title: string }) =>
    tCommon('lessonNum', {
      num: lesson.id,
      title: localizedLessonTitle(locale, unitId, lesson.id, lesson.title)
    })

  const handleSearchFocus = () => {
    if (searchFullLoaded) return
    loadVocabularyData()
      .then(async (vocab) => {
        const zh = await loadZhDict(locale)
        setSearchIndex(
          getSiteIndex({ locale, vocabulary: vocab, zhDict: zh, withWords: true })
        )
        setSearchFullLoaded(true)
      })
      .catch(() => {})
  }

  const handleSearchSelectWord = (doc: { payload?: Record<string, unknown> }) => {
    const w = doc.payload?.word as VocabularyWord | undefined
    if (!w) return
    const unit = units.find((u) => u.id === String(w.unit))
    const lesson = unit?.lessons.find((l) => String(l.id) === String(w.lesson))
    if (unit && lesson) handleLessonClick(unit.id, lesson.id, lesson.title)
  }

  const handleSearchSelectLesson = (doc: { payload?: Record<string, unknown> }) => {
    const p = doc.payload as { unitId: string; num: number | string; title: string } | undefined
    if (p) handleLessonClick(p.unitId, p.num, p.title)
  }

  const handleSearchSelectTheme = (doc: { payload?: Record<string, unknown> }) => {
    const p = doc.payload as { themeId: string; title: string } | undefined
    if (p) handleThemeClick(p.themeId, p.title)
  }

  const handleSearchSelectCategory = (category: { matchedAlias?: string; label: string }) => {
    setSearch(category.matchedAlias ?? category.label)
  }

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const openSection = (id: string, defaultValue: boolean) =>
    openSections[id] ?? defaultValue

  const handleLessonClick = (unitId: string, num: number | string, title: string) => {
    onSelectLesson(unitId, num, title)
    onNavigate?.()
  }

  const handleThemeClick = (themeId: string, title: string) => {
    onSelectTheme(themeId, title)
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col px-3 pb-3">
      {/* Brand header */}
      <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onGoHome}
            aria-label={t('dashboard')}
            className="shrink-0 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src="/app-logo.png"
              alt="Study Korean"
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-lg object-cover"
            />
          </button>
          <div className="flex min-w-0 flex-col overflow-hidden">
            <span className="truncate text-[13px] font-semibold leading-none text-foreground">
              Korean <span className="text-korean">Study</span>
            </span>
            <span className="mt-1 truncate text-[11px] leading-none text-muted-foreground">
              {tDash('lessonCount', { count: getTotalLessons() })}
            </span>
          </div>
        </div>
        {showCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mt-2 mb-1">
        <SearchBox
          index={searchIndex}
          value={search}
          onChange={setSearch}
          placeholder={t('searchLessons')}
          ariaLabel={t('searchLessons')}
          variant="sidebar"
          className="z-[60]"
          onFocus={() => handleSearchFocus()}
          onSelectWord={handleSearchSelectWord}
          onSelectLesson={handleSearchSelectLesson}
          onSelectTheme={handleSearchSelectTheme}
          onSelectCategory={handleSearchSelectCategory}
        />
      </div>

      {/* Nav */}
      <div className="scrollbar-hidden mt-2 flex-1 space-y-3 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          <NavRow icon={Home} label={t('dashboard')} onClick={() => { onGoHome(); onNavigate?.() }} />
          <NavRow
            icon={Brain}
            label={t('learnVocab')}
            onClick={() => { onGoToReview?.(); onNavigate?.() }}
            right={
              (reviewDue ?? 0) > 0 ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red/15 px-1.5 text-[10px] font-medium text-red">
                  {reviewDue}
                </span>
              ) : undefined
            }
          />
          <NavRow
            icon={BookMarked}
            label={t('vocabulary')}
            onClick={() => { onGoToVocabulary?.(); onNavigate?.() }}
          />
          {isAdmin && (
            <NavRow
              icon={ShieldCheck}
              label={tCommon('admin')}
              onClick={() => { window.location.href = `/${locale}/admin` }}
            />
          )}
        </div>

        {/* Curriculum */}
        <div className="flex flex-col gap-0.5 pt-1">
          <GroupHeading>{t('curriculum')}</GroupHeading>
          {units.map(unit => {
            const unitNameHit = matchUnitName(unit.name)
            const matchedLessons = queryActive
              ? unit.lessons.filter(l => lessonHitIds.has(`${unit.id}/${l.id}`))
              : unit.lessons
            if (queryActive && !unitNameHit && matchedLessons.length === 0) return null

            const isOpen = openSection(
              unit.id,
              Boolean(currentLesson?.unit === unit.id) ||
                Boolean(queryActive && (unitNameHit || matchedLessons.length > 0))
            )
            const done = getUnitCompletedCount(unit.id)
            const total = unit.lessons.length
            const pct = total > 0 ? Math.round(done / total * 100) : 0
            const Icon = iconMap[unit.icon] || BookOpen
            const lessons = unitNameHit ? unit.lessons : matchedLessons

            return (
              <Expandable
                key={unit.id}
                icon={Icon}
                label={unit.name}
                open={isOpen}
                onToggle={() => toggleSection(unit.id)}
                meta={
                  pct > 0 ? (
                    <span className={cn("flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium", pct >= 100 ? "bg-green/15 text-green" : "bg-primary/10 text-primary")}>
                      {pct}%
                    </span>
                  ) : undefined
                }
              >
                {lessons.map(lesson => {
                  const isActive = currentLesson?.unit === unit.id && currentLesson?.num === lesson.id
                  return (
                    <NavRow
                      key={lesson.id}
                      label={lessonLabel(unit.id, lesson)}
                      title={lessonLabel(unit.id, lesson)}
                      active={isActive}
                      done={isCompleted(unit.id, lesson.id)}
                      onClick={() => handleLessonClick(unit.id, lesson.id, lesson.title)}
                    />
                  )
                })}
              </Expandable>
            )
          })}
        </div>

        {/* Themes */}
        {(!queryActive || themeHitIds.size > 0) && (
          <div className="flex flex-col gap-0.5 pt-1">
            <GroupHeading>{t('themes')}</GroupHeading>
            {themes
              .filter(t => !queryActive || themeHitIds.has(`theme:${t.id}`))
              .map(theme => {
                const isActive = currentLesson?.unit === 'themes' && currentLesson?.num === theme.id
                const Icon = iconMap[theme.icon] || BookOpen
                return (
                  <NavRow
                    key={theme.id}
                    icon={Icon}
                    label={localizedThemeTitle(locale, theme.id, theme.title)}
                    active={isActive}
                    done={isCompleted('themes', theme.id)}
                    onClick={() => handleThemeClick(theme.id, theme.title)}
                  />
                )
              })}
          </div>
        )}

        {/* Empty search state */}
        {queryActive && !anyCourseHit && (
          <div className="px-2.5 py-4 text-center text-[12px] text-muted-foreground">
            {tSearch('noResults', { q: search })}
          </div>
        )}
      </div>

      {/* Footer: theme toggle + language switcher, relocated from the removed topbar */}
      <div className="mt-2 border-t border-border/50 pt-3">
        <InstallAppButton className="mb-2" />
        <AccountButton />
        <SidebarControls theme={theme} onToggleTheme={onToggleTheme} />
      </div>
    </div>
  )
}

export function Sidebar({
  currentLesson, onSelectLesson, onSelectTheme, onGoHome, onGoToVocabulary,
  onGoToReview, reviewDue, isCompleted, getUnitCompletedCount, isCollapsed,
  onToggleCollapse, mobileNavOpen, onMobileNavChange, theme, onToggleTheme
}: SidebarProps) {
  const t = useTranslations('nav')

  const sharedContentProps = {
    currentLesson, onSelectLesson, onSelectTheme, onGoHome, onGoToVocabulary,
    onGoToReview, reviewDue, isCompleted, getUnitCompletedCount, theme, onToggleTheme
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 hidden flex-col border-r border-border/50 bg-card/50 lg:flex',
          isCollapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        {isCollapsed ? (
          <div className="scrollbar-hidden flex h-full flex-col items-center gap-1 overflow-y-auto py-4">
            <button
              type="button"
              onClick={onGoHome}
              aria-label={t('dashboard')}
              className="mb-2 shrink-0 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image
                src="/app-logo.png"
                alt="Study Korean"
                width={40}
                height={40}
                priority
                className="h-10 w-10 rounded-lg object-cover"
              />
            </button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={onToggleCollapse} title={t('dashboard')}>
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon" className={cn('h-9 w-9 text-muted-foreground hover:text-foreground')} onClick={onGoHome} title={t('dashboard')}>
              <Home className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Button>
            {units.map(unit => {
              const Icon = iconMap[unit.icon] || BookOpen
              const firstLesson = unit.lessons[0]
              const isActive = currentLesson?.unit === unit.id
              return (
                <Button
                  key={unit.id}
                  variant="ghost"
                  size="icon"
                  className={cn('h-9 w-9', isActive ? 'bg-korean/10 text-korean' : 'text-muted-foreground hover:text-foreground')}
                  title={unit.name}
                  onClick={() => onSelectLesson(unit.id, firstLesson.id, firstLesson.title)}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </Button>
              )
            })}
            <div className="mt-auto flex flex-col items-center gap-1 border-t border-border/50 pt-3">
              <AccountButton collapsed />
              <InstallAppButton iconOnly />
              <SidebarControls theme={theme} onToggleTheme={onToggleTheme} collapsed />
            </div>
          </div>
        ) : (
          <SidebarContent
            {...sharedContentProps}
            showCollapse
            onToggleCollapse={onToggleCollapse}
          />
        )}
      </aside>

      {/* Mobile Sidebar — a floating button opens the sheet now that the
          topbar (which used to hold the menu trigger) is gone. */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('navigation')}
          onClick={() => onMobileNavChange?.(true)}
          className="fixed left-3 top-3 z-40 h-10 w-10 rounded-full border border-border/60 bg-background/80 shadow-sm backdrop-blur-xl hover:bg-card"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Sheet open={mobileNavOpen} onOpenChange={onMobileNavChange}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('navigation')}</SheetTitle>
            </SheetHeader>
            <SidebarContent {...sharedContentProps} showCollapse={false} onToggleCollapse={onToggleCollapse} onNavigate={() => onMobileNavChange?.(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
