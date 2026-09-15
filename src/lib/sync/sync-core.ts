/**
 * Pure sync state machines — no storage, no network, no React.
 * The client (sync/client.ts) feeds it local + cloud copies and it returns
 * verdicts and merged data. Kept dependency-free so the merge rules are easy
 * to reason about and unit-test.
 */

import type { SrsCard } from '@/lib/srs'
import { XP_PER_LESSON } from '@/lib/data'

export type SyncTable = 'progress' | 'srs'

/** localStorage shape kept by use-progress.ts (must stay identical). */
export interface ProgressData {
  completed: Record<string, number>
  streak: number
  lastStudyDate: string | null
  totalXp: number
  dailyActivity: Record<string, number>
}

/** localStorage shape kept by use-srs.ts (must stay identical). */
export interface SrsData {
  version: 1
  cards: Record<string, SrsCard>
  activity: Record<string, number>
}

export interface SyncMeta {
  /** Hash of the last data we pushed or adopted from the cloud. */
  hash: string
  /** When that happened. */
  at: number
}

export type SyncMetaByTable = Partial<Record<SyncTable, SyncMeta>>

/**
 * What to do with a table after comparing local vs cloud.
 *   noop      — nothing to do (both empty or identical)
 *   upload    — local is the only copy → push it
 *   download  — cloud is the only copy (or local is unchanged since last
 *               sync) → adopt it locally
 *   conflict  — both differ and local was edited since the last sync → ask
 */
export type SyncVerdict =
  | { table: SyncTable; kind: 'noop' }
  | { table: SyncTable; kind: 'upload' }
  | { table: SyncTable; kind: 'download' }
  | {
      table: SyncTable
      kind: 'conflict'
      local: ProgressData | SrsData
      cloud: ProgressData | SrsData
    }

/** Deterministic fingerprint; order of keys inside objects is irrelevant. */
export function hashOf(value: unknown): string {
  return JSON.stringify(value)
}

export function deepEqualLocal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** The three possible resolutions a user can pick for a conflict. */
export type SyncResolution = 'cloud' | 'device' | 'merge'

export function decide(
  table: SyncTable,
  local: ProgressData | SrsData | null,
  cloud: ProgressData | SrsData | null,
  lastSyncHash: string | undefined
): SyncVerdict {
  if (!cloud) {
    if (!local) return { table, kind: 'noop' }
    return { table, kind: 'upload' }
  }
  if (!local) {
    return { table, kind: 'download' }
  }
  if (deepEqualLocal(local, cloud)) {
    return { table, kind: 'noop' }
  }
  // Local hasn't changed since we last synced → the cloud is simply ahead.
  if (lastSyncHash === hashOf(local)) {
    return { table, kind: 'download' }
  }
  return { table, kind: 'conflict', local, cloud }
}

export function emptyProgress(): ProgressData {
  return { completed: {}, streak: 0, lastStudyDate: null, totalXp: 0, dailyActivity: {} }
}

export function emptySrs(): SrsData {
  return { version: 1, cards: {}, activity: {} }
}

/**
 * Union merge: completed lessons accumulate, XP is recomputed from the union
 * (avoids double-counting), per-day activity takes the max, streak and last
 * study date take the best of both.
 */
export function mergeProgress(local: ProgressData, cloud: ProgressData): ProgressData {
  const completed: Record<string, number> = { ...cloud.completed }
  for (const [key, value] of Object.entries(local.completed ?? {})) {
    completed[key] = Math.max(completed[key] ?? 0, value)
  }

  const dailyActivity: Record<string, number> = { ...cloud.dailyActivity }
  for (const [key, value] of Object.entries(local.dailyActivity ?? {})) {
    dailyActivity[key] = Math.max(dailyActivity[key] ?? 0, value)
  }

  const lastStudyDate =
    local.lastStudyDate && cloud.lastStudyDate
      ? (local.lastStudyDate > cloud.lastStudyDate ? local.lastStudyDate : cloud.lastStudyDate)
      : (local.lastStudyDate ?? cloud.lastStudyDate)

  return {
    completed,
    // XP is derived from how many lessons are marked complete.
    totalXp: Object.keys(completed).length * XP_PER_LESSON,
    dailyActivity,
    streak: Math.max(local.streak ?? 0, cloud.streak ?? 0),
    lastStudyDate,
  }
}

/**
 * Union merge for the deck: same card on both sides keeps the newer
 * `updatedAt` (older copies are the result of an earlier review).
 */
export function mergeSrs(local: SrsData, cloud: SrsData): SrsData {
  const cards: Record<string, SrsCard> = { ...local.cards }
  for (const [id, cloudCard] of Object.entries(cloud.cards ?? {})) {
    const localCard = cards[id]
    if (!localCard || (cloudCard.updatedAt ?? 0) >= (localCard.updatedAt ?? 0)) {
      cards[id] = cloudCard
    }
  }

  const activity: Record<string, number> = { ...cloud.activity }
  for (const [key, value] of Object.entries(local.activity ?? {})) {
    activity[key] = Math.max(activity[key] ?? 0, value)
  }

  return { version: 1, cards, activity }
}

export function resolveTable(
  table: SyncTable,
  conflict: { local: ProgressData | SrsData; cloud: ProgressData | SrsData },
  resolution: SyncResolution
): ProgressData | SrsData {
  if (resolution === 'cloud') return conflict.cloud
  if (resolution === 'device') return conflict.local
  return table === 'progress'
    ? mergeProgress(conflict.local as ProgressData, conflict.cloud as ProgressData)
    : mergeSrs(conflict.local as SrsData, conflict.cloud as SrsData)
}