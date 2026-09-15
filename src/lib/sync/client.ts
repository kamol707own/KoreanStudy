/**
 * Client-side sync engine — a non-React module singleton.
 *
 * - Hooks push snapshots here after every local mutation; we debounce+coalesce
 *   per table and upsert the whole row through RLS.
 * - Writes that fail (offline / Supabase project paused) go to a localStorage
 *   outbox and are flushed on reconnect.
 * - `pull` compares the local copy with the cloud copy and returns verdicts;
 *   the AccountProvider surfaces any conflicts to the user.
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import {
  decide,
  resolveTable,
  hashOf,
  type ProgressData,
  type SrsData,
  type SyncMetaByTable,
  type SyncResolution,
  type SyncTable,
  type SyncVerdict,
} from './sync-core'

export type SyncStatus = 'loading' | 'synced' | 'syncing' | 'offline' | 'error' | 'disabled'

export const SYNC_APPLIED_EVENT = 'korean-study:sync'

const STORAGE_KEYS: Record<SyncTable, string> = {
  progress: 'korean-study-progress',
  srs: 'korean-study-srs',
}
const OUTBOX_KEY = 'korean-study-sync-outbox'
const META_KEY = 'korean-study-sync-meta'

type SyncListener = (status: SyncStatus, userId: string | null) => void

interface OutboxEntry {
  data: ProgressData | SrsData
  at: number
}

type Outbox = Partial<Record<SyncTable, OutboxEntry>>

let userId: string | null = null
let status: SyncStatus = 'disabled'
const listeners = new Set<SyncListener>()
let outbox: Outbox = {}
let meta: SyncMetaByTable = {}
let flushTimer: ReturnType<typeof setTimeout> | undefined

/* ------------------------------------------------------------------ */
/* Storage helpers (must mirror the hooks' localStorage shapes)         */
/* ------------------------------------------------------------------ */

function readLocal(table: SyncTable): ProgressData | SrsData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[table])
    return raw ? (JSON.parse(raw) as ProgressData | SrsData) : null
  } catch {
    return null
  }
}

function writeLocal(table: SyncTable, data: ProgressData | SrsData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS[table], JSON.stringify(data))
}

function readOutbox(): Outbox {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    return raw ? (JSON.parse(raw) as Outbox) : {}
  } catch {
    return {}
  }
}

function persistOutbox() {
  if (typeof window === 'undefined') return
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox))
}

function readMeta(): SyncMetaByTable {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? (JSON.parse(raw) as SyncMetaByTable) : {}
  } catch {
    return {}
  }
}

function persistMeta() {
  if (typeof window === 'undefined') return
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

function setStatus(next: SyncStatus) {
  status = next
  notify()
}

function notify() {
  for (const listener of listeners) listener(status, userId)
}

/** Tell the hooks their data on disk changed so they reload it. */
function dispatchSyncApplied() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SYNC_APPLIED_EVENT))
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function subscribeSync(listener: SyncListener): () => void {
  listeners.add(listener)
  listener(status, userId)
  return () => {
    listeners.delete(listener)
  }
}

export function getSyncInterceptorState(): { status: SyncStatus; userId: string | null } {
  return { status, userId }
}

/** Called by the AccountProvider when the auth session changes. */
export function setSyncUser(nextUserId: string | null) {
  userId = nextUserId
  meta = readMeta()
  outbox = readOutbox()
  if (userId) {
    setStatus('loading')
  } else {
    setStatus(isSupabaseAvailable() ? 'synced' : 'disabled')
  }
}

function isSupabaseAvailable(): boolean {
  return Boolean(getSupabaseClient())
}

/**
 * Called by the hooks after every local mutation. Coalesces to the latest
 * snapshot per table and schedules a single flush shortly after.
 */
export function pushSync(table: SyncTable, data: ProgressData | SrsData) {
  if (!userId || typeof window === 'undefined') return
  outbox = readOutbox()
  outbox[table] = { data, at: Date.now() }
  persistOutbox()
  setStatus('syncing')
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    void flush()
  }, 500)
}

/** Upsert the current outbox snapshot(s) for a user. */
export async function flush(): Promise<void> {
  if (typeof window === 'undefined') return
  const supabase = getSupabaseClient()
  if (!supabase) {
    setStatus('disabled')
    return
  }
  if (!userId) return
  if (!navigator.onLine) {
    setStatus('offline')
    return
  }

  outbox = readOutbox()
  const pending = Object.entries(outbox) as [SyncTable, OutboxEntry][]
  if (pending.length === 0) {
    setStatus('synced')
    return
  }

  try {
    for (const [table, entry] of pending) {
      await upsertTable(supabase, table, entry.data)
      delete outbox[table]
      meta = readMeta()
      meta[table] = { hash: hashOf(entry.data), at: Date.now() }
      persistMeta()
    }
    persistOutbox()
    setStatus('synced')
  } catch {
    setStatus('offline')
  }
}

async function upsertTable(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  table: SyncTable,
  data: ProgressData | SrsData
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

/**
 * Fetch both rows and decide what to do. Automatically applies uploads and
 * downloads; returns only the parts the user must weigh in on.
 */
export async function pullSync(): Promise<SyncVerdict[]> {
  if (typeof window === 'undefined') return []
  const supabase = getSupabaseClient()
  if (!supabase) {
    setStatus('disabled')
    return []
  }
  if (!userId) return []
  if (!navigator.onLine) {
    setStatus('offline')
    return []
  }

  setStatus('syncing')
  const verdicts: SyncVerdict[] = []
  let changed = false

  try {
    for (const table of ['progress', 'srs'] as SyncTable[]) {
      const local = readLocal(table) as ProgressData | SrsData | null
      const { data: row, error } = await supabase
        .from(table)
        .select('data')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      const cloud = (row?.data as ProgressData | SrsData | null) ?? null

      const lastHash = readMeta()[table]?.hash
      const verdict = decide(table, local, cloud, lastHash)

      if (verdict.kind === 'upload') {
        await upsertTable(supabase, table, local!)
        meta = readMeta()
        meta[table] = { hash: hashOf(local), at: Date.now() }
        persistMeta()
      } else if (verdict.kind === 'download') {
        writeLocal(table, cloud!)
        meta = readMeta()
        meta[table] = { hash: hashOf(cloud), at: Date.now() }
        persistMeta()
        changed = true
      } else if (verdict.kind === 'conflict') {
        verdicts.push(verdict)
      }
    }
    if (verdicts.length === 0) setStatus('synced')
  } catch {
    setStatus('offline')
  }

  if (changed || verdicts.length > 0) dispatchSyncApplied()
  return verdicts
}

/**
 * Apply a user's choice for one conflicted table: cloud copy, this device's
 * copy, or a union merge. The chosen data is written locally AND pushed.
 */
export async function resolveSyncConflict(
  table: SyncTable,
  verdict: Extract<SyncVerdict, { kind: 'conflict' }>,
  resolution: SyncResolution
): Promise<void> {
  const chosen = resolveTable(table, verdict, resolution) as ProgressData | SrsData
  writeLocal(table, chosen)

  const supabase = getSupabaseClient()
  if (supabase && userId) {
    setStatus('syncing')
    try {
      await upsertTable(supabase, table, chosen)
    } catch {
      setStatus('offline')
    }
  }
  meta = readMeta()
  meta[table] = { hash: hashOf(chosen), at: Date.now() }
  persistMeta()

  dispatchSyncApplied()
  if (readOutbox()[table]) {
    delete outbox[table]
    persistOutbox()
  }
  setStatus('synced')
}

/** Reconnect handling: flush anything that piled up while offline. */
export function setupReconnectListener() {
  if (typeof window === 'undefined') return
  window.addEventListener('online', () => {
    void flush()
  })
}