/* eslint-disable react-hooks/set-state-in-effect -- mount-time restore of the
   saved SRS deck is intentional (same pattern as use-progress.ts) */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { createCard, nextReview, type SrsCard, type SrsGrade } from '@/lib/srs'
import { pushSync, SYNC_APPLIED_EVENT } from '@/lib/sync/client'

const STORAGE_KEY = 'korean-study-srs'

interface SrsData {
  version: 1
  cards: Record<string, SrsCard>
  /** 'YYYY-MM-DD' -> number of cards reviewed that day (feeds the heatmap). */
  activity: Record<string, number>
}

function emptySrs(): SrsData {
  return { version: 1, cards: {}, activity: {} }
}

function loadSrs(): SrsData {
  if (typeof window === 'undefined') return emptySrs()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptySrs()
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.cards) return emptySrs()
    if (typeof parsed.activity !== 'object' || parsed.activity === null) parsed.activity = {}
    // Cards saved by pre-sync builds have no `updatedAt`. Backfill with 0 so
    // in a cloud merge the (newer, timestamped) cloud copy wins the tie.
    for (const card of Object.values(parsed.cards) as SrsCard[]) {
      if (typeof card.updatedAt !== 'number') card.updatedAt = 0
    }
    return parsed as SrsData
  } catch {
    return emptySrs()
  }
}

function saveSrs(data: SrsData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function dateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function useSrs() {
  const [mounted, setMounted] = useState(false)
  const [srs, setSrs] = useState<SrsData>(emptySrs)

  useEffect(() => {
    setSrs(loadSrs())
    setMounted(true)
    const onSync = () => setSrs(loadSrs())
    window.addEventListener(SYNC_APPLIED_EVENT, onSync)
    return () => window.removeEventListener(SYNC_APPLIED_EVENT, onSync)
  }, [])

  /** Adds words as brand-new cards (no-op for words already in the deck). */
  const addWords = useCallback((wordIds: string[]) => {
    if (!wordIds.length) return 0
    const data = loadSrs()
    let added = 0
    for (const id of wordIds) {
      if (!data.cards[id]) {
        data.cards[id] = createCard(id)
        added += 1
      }
    }
    saveSrs(data)
    setSrs({ ...data })
    pushSync('srs', data)
    return added
  }, [])

  const removeWords = useCallback((wordIds: string[]) => {
    if (!wordIds.length) return
    const data = loadSrs()
    let changed = false
    for (const id of wordIds) {
      if (data.cards[id]) {
        delete data.cards[id]
        changed = true
      }
    }
    if (changed) {
      saveSrs(data)
      setSrs({ ...data })
      pushSync('srs', data)
    }
  }, [])

  /** Grades a card, reschedules it, and records the review for today. */
  const reviewWord = useCallback((wordId: string, grade: SrsGrade) => {
    const data = loadSrs()
    const card = data.cards[wordId]
    if (!card) return undefined
    data.cards[wordId] = nextReview(card, grade)
    const today = dateKey(new Date())
    data.activity[today] = (data.activity[today] || 0) + 1
    saveSrs(data)
    setSrs({ ...data })
    pushSync('srs', data)
    return data.cards[wordId]
  }, [])

  const getCard = useCallback((wordId: string): SrsCard | undefined => {
    return srs.cards[wordId]
  }, [srs.cards])

  return {
    mounted,
    cards: srs.cards,
    activity: srs.activity,
    addWords,
    removeWords,
    reviewWord,
    getCard,
  }
}