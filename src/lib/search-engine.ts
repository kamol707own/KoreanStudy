/**
 * Lightweight client-side search engine inspired by Typesense.
 *
 * Provides the pieces that matter for a dictionary-sized dataset:
 *   - typo tolerance (bounded edit distance, like Typesense's `typo` field)
 *   - search-as-you-type (prefix matching)
 *   - multilingual tokenization (Latin + Hangul + CJK words)
 *   - synonym / category expansion (the "colors" query hits every color word)
 *   - weighted relevance ranking (exact > prefix > contains > fuzzy)
 *
 * It is deliberately framework- and server-free: the corpus (~5k words plus a
 * few hundred lessons) is small enough that a per-query scan is a few ms, so
 * no inverted index or debounce bookkeeping is worth the complexity.
 */

export type SearchFieldTag =
  | 'label'
  | 'ko'
  | 'romanization'
  | 'en'
  | 'zh'
  | 'topic'
  | 'category'
  | 'tags'
  | 'concept'
  | 'unit'
  | 'subtitle'

export interface SearchField {
  text: string
  weight: number
  /** Why this text matches — used for result highlighting / category chips. */
  tag?: SearchFieldTag
}

export type SearchDocKind = 'word' | 'lesson' | 'theme'

export interface SearchDoc {
  id: string
  kind: SearchDocKind
  label: string
  subtitle?: string
  fields: SearchField[]
  payload?: Record<string, unknown>
}

export interface CategoryEntry {
  id: string
  label: string
  count: number
  aliases: string[]
  /** Set when the category was triggered; the alias that matched best. */
  matchedAlias?: string
}

export interface SearchHit<T extends SearchDoc = SearchDoc> {
  doc: T
  score: number
  /** Tag of the field that contributed the top score (drives UI labels). */
  source: SearchFieldTag | 'mixed'
}

export interface SearchResult<T extends SearchDoc = SearchDoc> {
  hits: SearchHit<T>[]
  categories: CategoryEntry[]
}

export interface SearchOptions {
  maxHits?: number
  maxCategories?: number
  kinds?: SearchDocKind[]
}

export interface AddDocInput<T extends SearchDoc = SearchDoc> {
  doc: T
  /** Concept ids this document belongs to (only words count toward category totals). */
  categoryIds?: string[]
}

/* ------------------------------------------------------------------ */
/* Normalization & tokenization                                        */
/* ------------------------------------------------------------------ */

const LATIN = /^[a-z0-9]/

/**
 * Lowercase, strip diacritics (used for romanization + borrowed words).
 * NFKD+mark-stripping would decompose Hangul syllables into jamo, so the
 * result is re-composed with NFC afterwards ("색" must stay "색").
 */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .toLowerCase()
}

/** Split on punctuation/whitespace. Hangul runs and CJK words stay whole. */
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9\uac00-\ud7af\u4e00-\u9fff]+/)
    .filter(Boolean)
}

/* ------------------------------------------------------------------ */
/* Typo tolerance                                                      */
/* ------------------------------------------------------------------ */

/** Damerau-style levenshtein distance with an early-exit bound. */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (cur[j] < rowMin) rowMin = cur[j]
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[prev.length - 1]
}

/**
 * How well a query token matches a single indexed token, 0..1.
 * Exact > prefix > contains > fuzzy (edit distance), never 0 for a real match.
 */
export function tokenMatch(queryToken: string, fieldToken: string): number {
  if (!queryToken || !fieldToken) return 0
  if (queryToken === fieldToken) return 1
  if (fieldToken.startsWith(queryToken)) {
    return queryToken.length === 1 ? 0.5 : 0.9
  }
  if (queryToken.length >= 2 && fieldToken.includes(queryToken)) return 0.75

  // Fuzzy only for tokens long enough that a typo is plausibly meant.
  // (4+ chars keep the common "colr → color", "numbr → number" cases
  // without bringing in 3-char collisions like "cld → old".)
  if (LATIN.test(queryToken)) {
    if (queryToken.length >= 4) {
      const d = editDistance(queryToken, fieldToken, 2)
      if (d === 1) return 0.6
      if (d === 2) return 0.4
    }
  } else if (
    queryToken.length >= 2 &&
    editDistance(queryToken, fieldToken, 1) === 1
  ) {
    return 0.55
  }
  return 0
}

/* ------------------------------------------------------------------ */
/* Index                                                               */
/* ------------------------------------------------------------------ */

const CATEGORY_ALIAS_THRESHOLD = 0.4

export class SearchIndex<T extends SearchDoc = SearchDoc> {
  private docs: T[] = []
  private categories = new Map<string, CategoryEntry>()

  addDoc(input: AddDocInput<T>): this {
    this.docs.push(input.doc)
    if (input.categoryIds && input.categoryIds.length > 0) {
      for (const id of input.categoryIds) {
        const entry = this.categories.get(id)
        if (entry) entry.count += 1
      }
    }
    return this
  }

  addCategory(entry: Omit<CategoryEntry, 'count'>): this {
    if (!this.categories.has(entry.id)) {
      this.categories.set(entry.id, { ...entry, count: 0 })
    }
    return this
  }

  get size(): number {
    return this.docs.length
  }

  /** Best single candidate score for a query token against one doc. */
  private tokenDocScore(
    token: string,
    doc: T
  ): { score: number; source: SearchFieldTag | 'mixed' } {
    let best = 0
    const sources: Partial<Record<SearchFieldTag, number>> = {}
    for (const field of doc.fields) {
      for (const ft of tokenize(field.text)) {
        const m = tokenMatch(token, ft)
        if (m <= 0) continue
        const weighted = m * field.weight
        if (weighted > best) best = weighted
        const tag = field.tag ?? 'label'
        sources[tag] = Math.max(sources[tag] ?? 0, m)
      }
    }
    if (best <= 0) return { score: 0, source: 'mixed' }

    // The dominant source is the tag whose raw token-match is highest
    // (undistorted by field weight, so a category match on a word means
    // "expanded via category", even though it also scores lower than a
    // bare field hit).
    let source: SearchFieldTag | 'mixed' = 'mixed'
    let top = 0
    for (const [tag, s] of Object.entries(sources) as [SearchFieldTag, number][]) {
      if (s > top) {
        top = s
        source = tag
      }
    }
    return { score: best, source }
  }

  private scoreDoc(tokens: string[], doc: T): SearchHit<T> | null {
    let total = 0
    let sourceField: SearchFieldTag | 'mixed' = 'mixed'
    for (const token of tokens) {
      const r = this.tokenDocScore(token, doc)
      if (r.score <= 0) return null // AND semantics across tokens
      total += r.score
      if (sourceField === 'mixed' || (r.source !== 'mixed' && r.source !== 'label')) {
        sourceField = r.source
      }
    }
    return { doc, score: total / tokens.length, source: sourceField }
  }

  /**
   * Ranked hits + triggered category suggestions for `query`.
   * Every token must match somewhere (AND), mirroring Typesense's default.
   */
  search(query: string, options: SearchOptions = {}): SearchResult<T> {
    const {
      maxHits = 12,
      maxCategories = 5,
      kinds,
    } = options

    const tokens = tokenize(query)
    if (tokens.length === 0) return { hits: [], categories: [] }

    const hits: SearchHit<T>[] = []
    for (const doc of this.docs) {
      if (kinds && !kinds.includes(doc.kind)) continue
      const hit = this.scoreDoc(tokens, doc)
      if (hit) hits.push(hit)
    }
    hits.sort((a, b) => b.score - a.score)

    const categories: CategoryEntry[] = []
    for (const entry of this.categories.values()) {
      if (entry.count <= 0) continue
      let best = 0
      let bestAlias = entry.label
      for (const token of tokens) {
        for (const alias of entry.aliases) {
          const normalizedAlias = normalize(alias)
          const s = tokenMatch(token, normalizedAlias)
          if (s > best) {
            best = s
            bestAlias = alias
          }
        }
      }
      if (best >= CATEGORY_ALIAS_THRESHOLD) {
        categories.push({ ...entry, count: entry.count, matchedAlias: bestAlias })
      }
    }
    categories.sort((a, b) => b.count - a.count)

    return {
      hits: hits.slice(0, maxHits),
      categories: categories.slice(0, maxCategories),
    }
  }

  /** All matching docs for a query — used by live grid/list filtering. */
  matchAll(query: string, kinds?: SearchDocKind[]): SearchHit<T>[] {
    const tokens = tokenize(query)
    if (tokens.length === 0) return []
    const hits: SearchHit<T>[] = []
    for (const doc of this.docs) {
      if (kinds && !kinds.includes(doc.kind)) continue
      const hit = this.scoreDoc(tokens, doc)
      if (hit) hits.push(hit)
    }
    hits.sort((a, b) => b.score - a.score)
    return hits
  }
}