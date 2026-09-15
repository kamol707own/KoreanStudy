'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { CategoryEntry, SearchHit, SearchIndex } from '@/lib/search-engine'
import type { SiteDoc } from '@/lib/site-search'
import { cn } from '@/lib/utils'
import {
  Search, BookOpen, Compass, Type, Layers, CornerDownLeft,
} from 'lucide-react'

type RowKind = 'word' | 'lesson' | 'theme' | 'category'

interface Row {
  key: string
  kind: RowKind
  label: string
  subtitle?: string
  hit?: SearchHit<SiteDoc>
  category?: CategoryEntry
}

export interface SearchBoxProps {
  /** Index to search; pass null while not ready yet (lazy-loaded sidebar). */
  index: SearchIndex<SiteDoc> | null
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  /** Fired on input focus (used by the sidebar to lazily load the word index). */
  onFocus?: () => void
  /** Sidebar style = ghost bare input; panel = bordered Input look. */
  variant?: 'sidebar' | 'panel'
  className?: string
  inputClassName?: string
  onSelectWord?: (doc: SiteDoc) => void
  onSelectLesson?: (doc: SiteDoc) => void
  onSelectTheme?: (doc: SiteDoc) => void
  onSelectCategory?: (category: CategoryEntry) => void
}

const KIND_ICON: Record<Exclude<RowKind, 'category'>, typeof Type> = {
  word: Type,
  lesson: BookOpen,
  theme: Compass,
}

function buildRows(
  hits: SearchHit<SiteDoc>[],
  categories: CategoryEntry[],
  wordCount: (count: number) => string
): Row[] {
  const rows: Row[] = []

  // Categories first — "colors — 71 words" is the most useful suggestion.
  for (const c of categories) {
    const countLabel = wordCount(c.count)
    rows.push({
      key: `cat:${c.id}`,
      kind: 'category',
      label: c.label,
      subtitle:
        c.matchedAlias && c.matchedAlias !== c.label
          ? `${c.matchedAlias} · ${countLabel}`
          : countLabel,
      category: c,
    })
  }

  // Then lessons/themes/words, each group keeping relevance order.
  for (const kind of ['lesson', 'theme', 'word'] as const) {
    for (const hit of hits) {
      if (hit.doc.kind !== kind) continue
      rows.push({
        key: `${hit.doc.kind}:${hit.doc.id}`,
        kind,
        label: hit.doc.label,
        subtitle: hit.doc.subtitle,
        hit,
      })
    }
  }
  return rows
}

export function SearchBox({
  index,
  value,
  onChange,
  placeholder,
  ariaLabel,
  onFocus,
  variant = 'panel',
  className,
  inputClassName,
  onSelectWord,
  onSelectLesson,
  onSelectTheme,
  onSelectCategory,
}: SearchBoxProps) {
  const t = useTranslations('search')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const query = value.trim()
  const results = useMemo(
    () => index?.search(query, { maxHits: 12, maxCategories: 4 }) ?? { hits: [], categories: [] },
    [index, query]
  )
  const rows = useMemo(
    () => buildRows(results.hits, results.categories, (n) => t('words', { count: n })),
    [results, t]
  )
  const hasResults = rows.length > 0

  // Close on outside interaction.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Reopen as the user types; reset the highlighted row. Adjusted during
  // render (keyed to query + index identity) instead of an effect, so we
  // don't trigger a cascading render cycle.
  const syncKey = `${query}|${index ? `idx:${index.size}` : 'no-index'}`
  const [lastSyncKey, setLastSyncKey] = useState(syncKey)
  if (lastSyncKey !== syncKey) {
    setLastSyncKey(syncKey)
    if (query.length > 0 && !!index) setOpen(true)
    else setOpen(false)
    setActive(0)
  }

  const close = () => {
    setOpen(false)
    inputRef.current?.blur()
  }

  const pick = (row: Row) => {
    if (row.kind === 'category') {
      onSelectCategory?.(row.category!)
    } else if (row.kind === 'word') {
      onSelectWord?.(row.hit!.doc)
    } else if (row.kind === 'lesson') {
      onSelectLesson?.(row.hit!.doc)
    } else if (row.kind === 'theme') {
      onSelectTheme?.(row.hit!.doc)
    }
    close()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      close()
      return
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setOpen(hasResults)
      return
    }
    if (!open || rows.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % rows.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + rows.length) % rows.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (rows[active]) pick(rows[active])
    }
  }

  const inputBase =
    variant === 'sidebar'
      ? 'h-8 w-full rounded-md bg-black/5 pl-8 pr-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-black/10 focus-visible:ring-1 focus-visible:ring-ring dark:bg-white/5 dark:focus:bg-white/10'
      : 'h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-base shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring md:text-sm'

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="relative">
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground/60',
            variant === 'sidebar' ? 'left-2.5 h-4 w-4' : 'left-3 h-4 w-4'
          )}
          strokeWidth={1.5}
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open && hasResults}
          aria-controls={query ? 'search-results' : undefined}
          aria-activedescendant={open && rows[active] ? rows[active].key : undefined}
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            onFocus?.()
            if (query.length > 0 && !!index) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          className={cn(inputBase, inputClassName)}
        />
        {open && query.length > 0 && (
          <button
            type="button"
            aria-label={t('clear')}
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
              setOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          >
            <span className="text-xs leading-none">✕</span>
          </button>
        )}
      </div>

      {open && (
        <div
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[min(60vh,340px)] overflow-y-auto rounded-lg border border-border/70 bg-card/95 p-1 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {rows.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">
              {t('noResults', { q: value })}
            </div>
          ) : (
            rows.map((row, i) => {
              const KindIcon = row.kind === 'category' ? Layers : KIND_ICON[row.kind]
              return (
                <button
                  key={row.key}
                  id={row.key}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onClick={() => pick(row)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'group flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                    i === active && 'bg-black/5 dark:bg-white/10'
                  )}
                >
                  <KindIcon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      row.kind === 'category'
                        ? 'text-korean'
                        : 'text-muted-foreground/70'
                    )}
                    strokeWidth={1.5}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-foreground">
                      {row.label}
                    </span>
                    {row.subtitle && (
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {row.subtitle}
                      </span>
                    )}
                  </span>
                  {row.kind !== 'category' && (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}