/**
 * SM-2 spaced repetition core — pure functions, no React, no storage.
 * Anki-style scheduling: each word card carries reps, lapses, interval,
 * ease and a due timestamp. Rating shifts the next review date.
 *
 * First rating of a new card:
 *   Again -> due today  ·  Hard -> 4d  ·  Good -> 7d  ·  Easy -> 14d
 * Adjustments after a successful review:
 *   Again -> interval 0, ease -0.2 (floor), lapses++
 *   Hard  -> interval * 1.2
 *   Good  -> interval * ease
 *   Easy  -> interval * ease * 1.3, ease +0.15 (cap)
 */

export type SrsGrade = 'again' | 'hard' | 'good' | 'easy'

export type SrsStage = 'new' | 'learning' | 'young' | 'mature'

export interface SrsCard {
  id: string
  /** Successful reviews (Hard/Good/Easy). Reset to 0 by Again. */
  reps: number
  /** Times the word was rated Again after becoming a known card. */
  lapses: number
  /** Current wait in days. 0 for a card that has never been successfully reviewed. */
  interval: number
  ease: number
  /** Next review date, ms since epoch. */
  due: number
  lastReview: number | null
  addedAt: number
  /**
   * Last mutation time, ms since epoch. Used by the cloud-merge so that when
   * the same card exists in two copies, the newer review wins. Legacy cards
   * (pre-sync builds) are backfilled with 0 so a cloud copy wins instead.
   */
  updatedAt: number
}

export const DAY_MS = 86400000

const MIN_EASE = 1.3
const MAX_EASE = 3.0
const MAX_INTERVAL = 365

export function createCard(wordId: string, now = Date.now()): SrsCard {
  return {
    id: wordId,
    reps: 0,
    lapses: 0,
    interval: 0,
    ease: 2.5,
    due: now,
    lastReview: null,
    addedAt: now,
    updatedAt: now,
  }
}

export function isDue(card: SrsCard, now = Date.now()): boolean {
  return card.due <= now
}

/** Apply a rating and return the reshaped card (new object). */
export function nextReview(card: SrsCard, grade: SrsGrade, now = Date.now()): SrsCard {
  const next: SrsCard = { ...card, lastReview: now, updatedAt: now }

  switch (grade) {
    case 'again': {
      next.lapses += 1
      next.ease = Math.max(MIN_EASE, next.ease - 0.2)
      next.reps = 0
      next.interval = 0
      next.due = now
      break
    }
    case 'hard': {
      next.reps += 1
      next.interval = firstInterval(grade, next.interval, next.ease)
      next.due = now + next.interval * DAY_MS
      break
    }
    case 'good': {
      next.reps += 1
      next.interval = firstInterval(grade, next.interval, next.ease)
      next.due = now + next.interval * DAY_MS
      break
    }
    case 'easy': {
      next.reps += 1
      next.ease = Math.min(MAX_EASE, next.ease + 0.15)
      next.interval = firstInterval(grade, next.interval, next.ease)
      next.due = now + next.interval * DAY_MS
      break
    }
  }

  next.interval = Math.min(MAX_INTERVAL, next.interval)
  return next
}

/**
 * Interval after a successful review. `current` is the pre-review interval;
 * a `current` of 0 means this was the card's first successful rating.
 */
function firstInterval(grade: SrsGrade, current: number, ease: number): number {
  if (current > 0) {
    if (grade === 'hard') return Math.max(1, Math.round(current * 1.2))
    if (grade === 'good') return Math.round(current * ease)
    return Math.round(current * ease * 1.3)
  }
  if (grade === 'hard') return 4
  if (grade === 'good') return 7
  return 14
}

/** Anki-ish deck-health buckets used by the dashboard donut. */
export function getStage(card: SrsCard): SrsStage {
  if (card.reps === 0 && card.lastReview === null) return 'new'
  if (card.interval <= 1) return 'learning'
  if (card.interval < 21) return 'young'
  return 'mature'
}

export interface CardStats {
  total: number
  dueToday: number
  newCount: number
  learning: number
  young: number
  mature: number
  learned: number
}

export function getCardStats(cards: Record<string, SrsCard>, now = Date.now()): CardStats {
  const stats: CardStats = {
    total: 0, dueToday: 0, newCount: 0, learning: 0, young: 0, mature: 0, learned: 0,
  }
  for (const card of Object.values(cards)) {
    stats.total += 1
    if (isDue(card, now)) stats.dueToday += 1
    if (card.reps > 0) stats.learned += 1
    const stage = getStage(card)
    if (stage === 'new') stats.newCount += 1
    else if (stage === 'learning') stats.learning += 1
    else if (stage === 'young') stats.young += 1
    else stats.mature += 1
  }
  return stats
}

/** Ids of cards currently due (due today or overdue). */
export function getDueIds(cards: Record<string, SrsCard>, now = Date.now()): string[] {
  return Object.values(cards)
    .filter((card) => isDue(card, now))
    .sort((a, b) => a.due - b.due)
    .map((card) => card.id)
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Words due per day for the next `days` days (index 0 = today + overdue).
 * A word counts for the day its `due` timestamp falls in, except words overdue
 * before today which are folded into day 0.
 */
export function getForecast(cards: Record<string, SrsCard>, days = 7, now = Date.now()): number[] {
  const out = new Array<number>(days).fill(0)
  const today0 = startOfDay(now)
  for (const card of Object.values(cards)) {
    if (card.due <= today0) {
      out[0] += 1
      continue
    }
    const diffDays = Math.floor((card.due - today0) / DAY_MS)
    if (diffDays < days) out[diffDays] += 1
  }
  return out
}