'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAppLocale } from '@/i18n/use-app-locale'
import { localizedVocabMeaning } from '@/lib/i18n/content'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSrs } from '@/hooks/use-srs'
import { nextReview, isDue, type SrsGrade } from '@/lib/srs'
import type { VocabularyWord } from '@/lib/vocabulary'
import {
  Volume2, CheckCircle2, Layers, RotateCcw, ArrowLeft, MousePointerClick
} from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  noun: 'bg-blue/15 text-blue',
  verb: 'bg-green/15 text-green',
  adjective: 'bg-gold/15 text-gold',
  adverb: 'bg-korean/15 text-korean',
  phrase: 'bg-purple-500/15 text-purple-400',
  grammar: 'bg-red/15 text-red',
}

const GRADES: SrsGrade[] = ['again', 'hard', 'good', 'easy']

const GRADE_STYLES: Record<SrsGrade, { border: string; text: string; hover: string }> = {
  again: { border: 'border-red/30', text: 'text-red', hover: 'hover:bg-red/20' },
  hard: { border: 'border-gold/30', text: 'text-gold', hover: 'hover:bg-gold/20' },
  good: { border: 'border-blue/30', text: 'text-blue', hover: 'hover:bg-blue/20' },
  easy: { border: 'border-green/30', text: 'text-green', hover: 'hover:bg-green/20' },
}

interface ReviewSessionProps {
  /** Word ids for this session (due deck or a lesson's words). */
  cardIds: string[]
  onExit: () => void
  /** The single shared SRS store — never create a second copy inside a view. */
  srs: ReturnType<typeof useSrs>
  vocabulary: VocabularyWord[]
  zhDict: Record<string, string>
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
}

/** Compact "wait until next review" label for a card after a given grade. */
function intervalLabel(interval: number, t: (key: string, values?: { n: number }) => string): string {
  if (interval <= 0) return t('intervalMinutes', { n: 10 })
  if (interval < 1) return t('intervalMinutes', { n: Math.round(interval * 1440) })
  if (interval < 30) return t('intervalDays', { n: Math.round(interval) })
  if (interval < 365) return t('intervalWeeks', { n: Math.round(interval / 7) })
  return t('intervalMonths', { n: Math.round(interval / 30) })
}

/** True for phones / small tablets held in landscape — the grade buttons move
 *  to a right-hand rail so everything fits without scrolling. */
function useCompactLandscape() {
  const [compactLandscape, setCompactLandscape] = useState(false)
  useEffect(() => {
    const mqLandscape = window.matchMedia('(orientation: landscape)')
    const mqWidth = window.matchMedia('(max-width: 1023px)')
    const update = () => setCompactLandscape(mqLandscape.matches && mqWidth.matches)
    update()
    mqLandscape.addEventListener?.('change', update)
    mqWidth.addEventListener?.('change', update)
    return () => {
      mqLandscape.removeEventListener?.('change', update)
      mqWidth.removeEventListener?.('change', update)
    }
  }, [])
  return compactLandscape
}

function GradeButton({
  grade, preview, onGrade, t, vertical,
}: {
  grade: SrsGrade
  preview: string | undefined
  onGrade: (grade: SrsGrade) => void
  t: (key: string) => string
  vertical: boolean
}) {
  const style = GRADE_STYLES[grade]
  return (
    <button
      type="button"
      onClick={() => onGrade(grade)}
      aria-label={`${t(grade)}${preview ? ` · ${preview}` : ''}`}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border font-semibold',
        style.border,
        style.text,
        style.hover,
        'bg-card/80 backdrop-blur-sm transition-all duration-150 active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        vertical ? 'w-full min-h-[54px] px-2 py-2 text-sm' : 'gap-1 py-3 min-h-[54px] text-sm'
      )}
    >
      <span className="leading-none">{t(grade)}</span>
      {preview && (
        <span className="text-[10px] font-medium opacity-60 leading-none">{preview}</span>
      )}
    </button>
  )
}

function Grades({
  vertical, previews, onGrade, t,
}: {
  vertical: boolean
  previews: Record<SrsGrade, string> | null
  onGrade: (grade: SrsGrade) => void
  t: (key: string) => string
}) {
  return (
    <div className={cn(vertical ? 'flex w-full flex-col gap-2' : 'grid grid-cols-4 gap-2')}>
      {GRADES.map(grade => (
        <GradeButton
          key={grade}
          grade={grade}
          vertical={vertical}
          preview={previews?.[grade]}
          onGrade={onGrade}
          t={t}
        />
      ))}
    </div>
  )
}

export function ReviewSession({ cardIds, onExit, srs, vocabulary, zhDict }: ReviewSessionProps) {
  const locale = useAppLocale()
  const t = useTranslations('srs')
  const compactLandscape = useCompactLandscape()

  const byId = useMemo(() => {
    const map = new Map<string, (typeof vocabulary)[number]>()
    for (const w of vocabulary) map.set(w.id, w)
    return map
  }, [vocabulary])

  // The queue is a snapshot of the deck taken at session start. Ratings change
  // the underlying SRS state (a graded card is no longer "due"), but the live
  // card list must NOT reboot the session mid-review. The parent mounts this
  // component only once the card ids are final.
  const [queue, setQueue] = useState<string[]>(cardIds)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const done = queue.length > 0 && index >= queue.length

  // Stop speaking if the user leaves mid-way / silent guard on unmount.
  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  const rate = useCallback(
    (grade: SrsGrade) => {
      if (!revealed || done) return
      const currentId = queue[index]
      if (currentId) srs.reviewWord(currentId, grade)
      if (grade === 'again') {
        // Re-queue a failed word at the end of the session (Anki learning step).
        setQueue(prev => [...prev.filter(id => id !== currentId), currentId])
      } else {
        setIndex(i => i + 1)
      }
      setRevealed(false)
    },
    [revealed, done, queue, index, srs]
  )

  // Reveal only — the answer stays visible so the user can grade at their own
  // pace. Tapping a revealed card does not hide it again.
  const flip = useCallback(() => {
    if (done || revealed) return
    const word = byId.get(queue[index])
    if (word) speak(word.korean)
    setRevealed(true)
  }, [done, revealed, queue, index, byId])

  // Keyboard: Space = reveal, 1-4 = grade a revealed card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return
      if (e.key === ' ') {
        e.preventDefault()
        flip()
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        if (revealed) {
          rate(GRADES[Number(e.key) - 1])
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flip, rate, revealed, done])

  const currentId = queue[index]
  const word = currentId ? byId.get(currentId) : undefined
  const total = queue.length
  const progressPct = total > 0 ? Math.min(100, Math.round((index / total) * 100)) : 100

  // Interval previews per grade for the current revealed card, e.g.
  // Again -> "10m" · Easy -> "2w". Hidden until the answer is shown.
  const previews = useMemo<Record<SrsGrade, string> | null>(() => {
    if (!revealed || !currentId) return null
    const card = srs.getCard(currentId)
    if (!card) return null
    const out = {} as Record<SrsGrade, string>
    for (const grade of GRADES) {
      out[grade] = intervalLabel(nextReview(card, grade).interval, t)
    }
    return out
  }, [revealed, currentId, srs, t])

  const remainingDue = useMemo(() => {
    let n = 0
    for (const id of queue) {
      const card = srs.getCard(id)
      if (card && isDue(card)) n += 1
    }
    return n
  }, [queue, srs])

  return (
    // The session claims the full mobile viewport (cancelling the page gutters)
    // so card + grades fit on one screen without scrolling — key on landscape.
    <div
      className={cn(
        'relative -mt-16 lg:-mt-0 -mb-20 lg:-mb-0 flex min-h-[calc(100dvh-4.25rem)] flex-col',
        'animate-in fade-in slide-in-from-bottom-4 duration-500'
      )}
    >
      {/* Header — pl clears the floating menu button on mobile */}
      <div className="relative z-40 flex items-center justify-between gap-2 pl-12 lg:pl-0 shrink-0">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-korean/15 flex items-center justify-center">
            <Layers className="w-3 h-3 text-korean" />
          </div>
          <span className={cn('text-sm font-semibold', compactLandscape ? 'hidden' : '')}>{t('title')}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{index} / {total}</span>
          {remainingDue > 0 && (
            <span className="rounded-full bg-red/15 px-2 py-0.5 text-[10px] font-semibold text-red tabular-nums">
              {remainingDue} {t('due')}
            </span>
          )}
        </div>
      </div>

      <div className="h-1 bg-muted rounded-full overflow-hidden mt-3 mb-4 shrink-0">
        <div className="h-full bg-gradient-to-r from-korean-dim to-korean rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      {done ? (
        <Card className="my-auto border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-green/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green" />
            </div>
            <h2 className="text-2xl font-bold mb-1">{t('done')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('completedToday', { count: total })}</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button variant="outline" onClick={() => { setQueue(cardIds); setIndex(0); setRevealed(false) }} className="gap-2">
                <RotateCcw className="w-4 h-4" /> {t('reviewAgain')}
              </Button>
              <Button onClick={onExit} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !word ? (
        <Card className="my-auto border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8 sm:p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">{t('noWordsReview')}</p>
            <Button onClick={onExit} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/** Tap anywhere on the screen to reveal the answer. */}
          {!revealed && (
            <button
              type="button"
              aria-label={t('tapToReveal')}
              onClick={flip}
              className="absolute inset-0 z-30 cursor-pointer focus-visible:outline-none"
            />
          )}

          <div className={cn(
            'relative z-20 flex min-h-0 flex-1 items-center justify-center gap-5',
            compactLandscape ? 'flex-row' : 'flex-col'
          )}>
            {/* Flashcard */}
            <div
              className={cn(
                'select-none w-full',
                compactLandscape ? 'flex-1 max-w-[58%]' : 'max-w-[560px]'
              )}
            >
              <div
                className={cn(
                  'rounded-2xl border text-center transition-all duration-300',
                  'border-border/40 bg-gradient-to-br from-card/80 to-card/30 backdrop-blur-sm',
                  'hover:border-korean/30',
                  compactLandscape ? 'px-5 py-8' : 'px-5 py-12 sm:px-6 sm:py-16'
                )}
              >
                {!revealed ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-6">
                      <Badge className={cn('text-[10px] px-2 py-0.5 capitalize', CATEGORY_COLORS[word.category] || 'bg-muted text-muted-foreground')}>
                        {word.category}
                      </Badge>
                      <button
                        type="button"
                        aria-label={t('speak')}
                        onClick={(e) => { e.stopPropagation(); speak(word.korean) }}
                        className="relative z-40 h-9 w-9 rounded-full border border-border/60 bg-card/60 flex items-center justify-center hover:border-korean/40 transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4 text-korean" />
                      </button>
                    </div>
                    <div className={cn('font-bold tracking-tight text-foreground mb-8', compactLandscape ? 'text-3xl' : 'text-4xl sm:text-5xl')}>
                      {word.korean}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      {t('tapToReveal')}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={cn('font-bold tracking-tight text-foreground mb-3', compactLandscape ? 'text-3xl' : 'text-4xl sm:text-5xl')}>
                      {word.korean}
                    </div>
                    <div className="text-lg font-medium text-korean mb-6">
                      {localizedVocabMeaning(locale, word, zhDict)}
                    </div>
                    {word.romanization && (
                      <div className={cn('text-sm text-muted-foreground mb-6', compactLandscape && 'hidden')}>{word.romanization}</div>
                    )}
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('howDidYouDo')}</div>
                  </div>
                )}
              </div>
            </div>

            {/** Compact landscape: right-hand grade rail (right-handed thumb UX). */}
            {compactLandscape && revealed && (
              <div className="w-32 shrink-0 animate-in fade-in slide-in-from-right-2 duration-300">
                <Grades vertical previews={previews} onGrade={rate} t={t} />
              </div>
            )}
          </div>

          {/** Portrait / tablet / desktop: grades under the card, revealed only. */}
          {!compactLandscape && revealed && (
            <div className="relative z-30 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Grades vertical={false} previews={previews} onGrade={rate} t={t} />
              <p className="hidden sm:block mt-3 text-center text-[11px] text-muted-foreground/70">
                {t('keyboardHint')}
              </p>
            </div>
          )}

          {/** Compact landscape: tiny keyboard hint right under the card. */}
          {compactLandscape && revealed && (
            <p className="relative z-30 shrink-0 text-center text-[10px] text-muted-foreground/70">
              {t('shortHint')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}