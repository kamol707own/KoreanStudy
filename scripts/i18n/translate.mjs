#!/usr/bin/env node
/**
 * Batch translation pipeline for Korean Study.
 *
 * Translates three buckets from English into the requested locales:
 *   1. Bucket A – UI strings        -> messages/{locale}.json       (missing keys only)
 *   2. Short content (unit/lesson/theme/topic titles + vocab meanings)
 *                                  -> src/lib/i18n/content.{locale}.json
 *   3. Bucket B – lesson markdown   -> public/lessons/{locale}/...   (missing files only)
 *
 * Engines (per-language, see ENGINES below):
 *   - zh, vi -> DeepL API (free tier). Key in .env as DEEPL_API_KEY; free
 *     keys end in ":fx" (the script then uses the api-free.deepl.com
 *     endpoint automatically).
 *   - bn, ne -> self-hosted LibreTranslate (Docker) at
 *     http://localhost:5000/translate (override with LIBRETRANSLATE_URL).
 *     No key needed. Unsupported/missing language models surface as 4xx and
 *     are logged + skipped per batch rather than crashing the run.
 *
 * Korean protection (IMPORTANT):
 *   The engines translate text inside <span> tags, so Korean must NEVER be
 *   sent to the API. Before every request, Hangul phrases (runs separated
 *   only by whitespace are grouped into one phrase so internal spaces are
 *   kept) and URLs are replaced by opaque empty tags <k0></k0> … held in a
 *   per-entry registry. After translation the tags are stitched back to the
 *   exact original Korean/URLs. Table rows are translated as whole rows
 *   (pipes preserved) so short cells keep their context; rows containing no
 *   English are kept verbatim.
 *
 * Other rules:
 *   - Anything with a non-empty translation is skipped, so re-runs after
 *     English edits only translate the diffs (use --force to redo).
 *   - Characters submitted on successful requests are logged to
 *     scripts/i18n/quota.log.
 *   - Every newly translated lesson file is recorded in
 *     scripts/i18n/review-status.{locale}.json with "reviewed": false.
 *   - The free DeepL tier occasionally appends the target-language name
 *     (e.g. "简体中文（大陆）") to short segments; sanitize() strips it.
 *
 * Usage:
 *   node scripts/i18n/translate.mjs --langs zh       # DeepL (needs DEEPL_API_KEY)
 *   node scripts/i18n/translate.mjs --langs bn       # LibreTranslate on :5000
 *   node scripts/i18n/translate.mjs --langs zh --dry-run  # no API, no writes
 *   node scripts/i18n/translate.mjs --langs vi --force
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MESSAGES_DIR = join(ROOT, 'messages')
const CONTENT_DIR = join(ROOT, 'src', 'lib', 'i18n')
const LESSONS_DIR = join(ROOT, 'public', 'lessons')
const STATUS_DIR = join(ROOT, 'scripts', 'i18n')
const QUOTA_LOG = join(STATUS_DIR, 'quota.log')
const DEEPL_FREE_QUOTA = 500_000 // replaced by the account's real limit at startup

/**
 * Per-language engine config — the single place to change which service
 * translates which locale. `to` is the engine's target-language code.
 */
const ENGINES = {
  // DeepL key is exhausted (1M lifetime cap). Google's free gtx endpoint
  // produces the best Chinese but blocks this IP on sustained bulk runs, so
  // zh currently uses the LOCAL LibreTranslate server (en→zh-Hans, .lt-venv):
  // no key, no quota, no rate limits — at a quality cost (rougher prose
  // around inline Korean; mangled output is fingerprinted by 联合国/页:1
  // headers). To upgrade later: switch back to engine 'google' (to 'zh-CN')
  // and delete the affected files in public/lessons/zh to retranslate.
  zh: { engine: 'libretranslate', to: 'zh-Hans' },
  vi: { engine: 'deepl', to: 'vi' },
  bn: { engine: 'libretranslate', to: 'bn' },
  ne: { engine: 'libretranslate', to: 'ne' },
}
const TRANSLATED_LOCALES = Object.keys(ENGINES)

/** Junk the free translation tiers sometimes append — strip after stitching. */
const JUNK = {
  zh: [/[（(]\s*简体中文(?:（大陆|中国大陆）)?\s*[）)]/g, /简体中文(?:（大陆|中国大陆）)?/g],
  vi: [],
  bn: [],
  ne: [],
}

/**
 * Terminology fixes for LibreTranslate's zh output. The local en→zh model
 * misses grammar domain vocabulary (verified empirically); these replacements
 * bring it in line with the terms used in the Google/DeepL-translated units:
 *   particle 粒子(物理)→助词, stem 干线(铁路)→词干, conjugation 调和→变形,
 *   tense 当前时态→现在时, question words 问话→疑问词, honorifics 荣誉词→敬语词.
 */
const LT_ZH_FIXES = [
  [/粒子/g, '助词'],
  [/干线/g, '词干'],
  [/动词的干/g, '动词词干'],
  [/形容词的干/g, '形容词词干'],
  [/当前时态/g, '现在时'],
  [/现在时态/g, '现在时'],
  [/过去时态/g, '过去时'],
  [/将来时态/g, '将来时'],
  [/荣誉词/g, '敬语词'],
  [/问话/g, '疑问词'],
  [/调和/g, '变形'],
  [/非正式发言/g, '非正式用语'],
  [/礼貌的演讲/g, '敬语'],
]

function sanitize(locale, text) {
  let out = text
  for (const re of JUNK[locale] || []) out = out.replace(re, '')
  if (locale === 'zh') {
    for (const [re, to] of LT_ZH_FIXES) out = out.replace(re, to)
  }
  // HTML-aware engines escape & < > in their output; restore the raw chars.
  return out
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')
const onlyFile = flag('file') // e.g. unit0/lesson1 — retranslate one file

let langs = (flag('langs') || 'zh,vi')
  .split(',')
  .map((s) => s.trim())
  .filter((l) => TRANSLATED_LOCALES.includes(l))
if (langs.length === 0) {
  console.error('No translatable locales. Use --langs zh,vi (available: ' + TRANSLATED_LOCALES.join(', ') + ')')
  process.exit(1)
}

// Load credentials from .env.local / .env (already-set env vars win).
// Kept dependency-free so the script stays a plain `node` invocation.
function loadDotEnv() {
  for (const file of ['.env.local', '.env']) {
    let text
    try {
      text = readFileSync(join(ROOT, file), 'utf8')
    } catch {
      continue
    }
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!m) continue
      let value = m[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = value
    }
  }
}
loadDotEnv()

if (!dryRun) {
  const needKey = langs.filter((l) => ENGINES[l].engine === 'deepl')
  if (needKey.length > 0 && !process.env.DEEPL_API_KEY) {
    console.error(
      `Set DEEPL_API_KEY in .env (see .env.example) for: ${needKey.join(', ')} ` +
        '(or run with --dry-run). LibreTranslate locales (bn, ne) need no key.'
    )
    process.exit(1)
  }
}

// ------------------------------------------------------------ file helpers

const readJson = (file, fallback = {}) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return JSON.parse(JSON.stringify(fallback))
  }
}
const writeJson = (file, obj) =>
  writeFileSync(file, JSON.stringify(obj, null, 2) + '\n')

function collectLeafKeys(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out.push({ path, text: v })
    else if (v && typeof v === 'object') collectLeafKeys(v, path, out)
  }
  return out
}

function setAtPath(obj, path, value) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {}
    cur = cur[parts[i]]
  }
  cur[parts[parts.length - 1]] = value
}

// ------------------------------------------------ Korean/URL protection
//
// Korean and URLs are NEVER sent to the engines. planText() swaps each
// Hangul phrase and each URL for an empty tag <kN></kN> and records the
// original value; stitch() puts the originals back after translation. Two
// Hangul runs separated only by whitespace are grouped into a single phrase
// so their internal spacing survives (engines collapse whitespace between
// adjacent tags, which would fuse words like "학교에 가요" into "학교에가요").

const HANGUL_PHRASE_RE = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]+(?:(?:\s|^)[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]+)*/g
const URL_RE = /https?:\/\/[^\s<>"')\]]+/g
const TAG_RE = /<k\d+><\/k\d+>/g

/**
 * Replace Hangul phrases (including any **bold** markers that hug them, so
 * the engines never see asterisks next to tags) and URLs with empty
 * <kN></kN> tags. Returns { tagged, registry } where registry[N] is the
 * exact original value of <kN>.
 */
function planText(text) {
  const registry = []
  let counter = 0
  let out = ''
  let last = 0
  const hits = []
  // Hangul phrase ranges, extended to swallow adjacent **bold** markers.
  // Each hit is [start, len, leadBold, trailBold] so the flags survive the
  // position sort below.
  for (const m of text.matchAll(HANGUL_PHRASE_RE)) {
    let start = m.index
    let len = m[0].length
    let leadBold = false
    let trailBold = false
    if (text.slice(start - 2, start) === '**') {
      start -= 2
      len += 2
      leadBold = true
    }
    if (text.slice(start + len, start + len + 2) === '**') {
      len += 2
      trailBold = true
    }
    hits.push([start, len, leadBold, trailBold])
  }
  for (const m of text.matchAll(URL_RE)) hits.push([m.index, m[0].length, false, false])
  hits.sort((a, b) => a[0] - b[0])
  // Drop overlapping hits (guard: bold-extended phrases could overlap the
  // phrase before them when markdown is malformed).
  let prevEnd = -1
  for (const [start, len, hitLeadBold, hitTrailBold] of hits) {
    if (start < prevEnd) continue
    out += text.slice(last, start)
    let value = text.slice(start, start + len)
    // Bold markers hugging a Korean phrase are protected as their own
    // fragments. Literal `**` next to a <kN></kN> tag gets shuffled to the
    // inside of the phrase by the engine (producing `**한국어****`), while
    // empty tags reliably stay in place.
    if (hitLeadBold && value.startsWith('**')) {
      out += `<k${counter}></k${counter}>`
      registry[counter] = '**'
      counter++
      value = value.slice(2)
    }
    const trailing = hitTrailBold && value.endsWith('**')
    if (trailing) value = value.slice(0, -2)
    registry[counter] = value
    out += `<k${counter}></k${counter}>`
    counter++
    if (trailing) {
      out += `<k${counter}></k${counter}>`
      registry[counter] = '**'
      counter++
    }
    last = start + len
    prevEnd = last
  }
  out += text.slice(last)
  return { tagged: out, registry }
}

function stitch(text, registry) {
  return text.replace(/<k(\d+)><\/k\d+>/g, (_, n) => registry[Number(n)] ?? '')
}

// --------------------------------------------------------- engine adapters

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

class EngineError extends Error {
  /**
   * category:
   *  - 'network'  → service unreachable (fatal for this locale)
   *  - 'auth'     → bad/missing credentials (fatal for this locale)
   *  - 'quota'    → monthly quota exhausted (fatal for this locale)
   *  - 'transient'→ rate limit / 5xx (retried with backoff first)
   *  - 'request'  → this batch is un-translatable (logged, skipped, run continues)
   */
  constructor(message, category) {
    super(message)
    this.category = category
  }
}

function categorizeStatus(status, bodyText, service) {
  if (status === 401 || status === 403)
    return new EngineError(`${service} ${status} (auth): ${bodyText.slice(0, 200)}`, 'auth')
  if (status === 456)
    return new EngineError(`${service} ${status}: monthly character quota exceeded`, 'quota')
  if (status === 429 || status >= 500)
    return new EngineError(`${service} ${status}: ${bodyText.slice(0, 200)}`, 'transient')
  return new EngineError(`${service} ${status}: ${bodyText.slice(0, 200)}`, 'request')
}

async function deeplTranslate(texts, targetLang) {
  const key = process.env.DEEPL_API_KEY
  // Free keys end in ":fx" and must hit the api-free endpoint.
  const endpoint = key.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate'
  const body = new URLSearchParams({ source_lang: 'en', target_lang: targetLang, tag_handling: 'html' })
  for (const t of texts) body.append('text', t)

  let res
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
  } catch (err) {
    throw new EngineError(`DeepL unreachable: ${err.message}`, 'network')
  }
  if (!res.ok) {
    throw categorizeStatus(res.status, await res.text().catch(() => ''), 'DeepL')
  }
  const data = await res.json()
  const out = (data.translations || []).map((t) => t.text ?? '')
  if (out.length !== texts.length) {
    throw new EngineError(`DeepL returned ${out.length} translations for ${texts.length} texts`, 'request')
  }
  return out
}

const GOOGLE_BASE = 'https://translate.googleapis.com/translate_a/single'
const GOOGLE_UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'en,zh' }

// Adaptive pacing shared across every request of a run. Google's free
// endpoint blocks IPs that sustain even modest request rates, so we start
// slow, double the gap on every 429 and take a long pause after a burst of
// them; a clean stretch slowly decays back toward the minimum gap.
const googleLimiter = {
  delay: 900, // ms between requests — start conservative
  min: 300,
  max: 6_000,
  busy: 0,
  clean: 0,
  async wait() {
    if (this.delay > 0) await sleep(this.delay + Math.random() * 150)
  },
  hit() {
    this.busy++
    this.clean = 0
    this.delay = Math.min(this.max, Math.round(this.delay * 1.7))
  },
  ok() {
    this.busy = 0
    this.clean++
    // recover one notch per ~40 clean requests, never below the min gap
    if (this.clean >= 40 && this.delay > this.min) {
      this.delay = Math.max(this.min, Math.round(this.delay * 0.82))
      this.clean = 0
    }
  },
}

/**
 * Google's public (keyless) translate endpoint. Several strings are joined
 * with newlines into one request (Google translates line-by-line), which
 * cuts the request count ~5x; if the output's line count doesn't match,
 * the batch falls back to one request per string. Retries transient errors
 * with backoff; if anything still fails we throw so the caller defers — we
 * never return untranslated English as a "translation".
 */
async function googleTranslate(texts, targetLang) {
  const result = new Array(texts.length)
  const groups = []
  const GROUP = 5
  for (let i = 0; i < texts.length; i += GROUP) groups.push(i)

  for (const start of groups) {
    const slice = texts.slice(start, start + GROUP)
    let lines = null
    for (let attempt = 0; attempt < 4 && lines == null; attempt++) {
      if (attempt > 0) {
        const wait = Math.min(20_000, 2000 * 2 ** attempt)
        googleLimiter.hit()
        console.warn(`      [google 429/busy, attempt ${attempt + 1}/4] backing off ${Math.round(wait / 1000)}s`)
        await sleep(wait)
        // A burst of refusals means Google blocked us — pause the whole run.
        if (googleLimiter.busy >= 4) {
          console.warn(`      [google] consecutive refusals — pausing 60s to let the block lift`)
          await sleep(60_000)
          googleLimiter.busy = 0
        }
      }
      await googleLimiter.wait()
      try {
        const url = `${GOOGLE_BASE}?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(slice.join('\n'))}`
        const res = await fetch(url, {
          headers: GOOGLE_UA,
          signal: AbortSignal.timeout(25_000),
        })
        if (res.status === 429 || res.status === 403 || res.status >= 500) continue
        if (!res.ok) {
          throw new EngineError(`Google ${res.status}: ${(await res.text()).slice(0, 150)}`, 'request')
        }
        const data = await res.json()
        const joined = (data?.[0] || []).map((seg) => seg?.[0] ?? '').join('')
        const split = joined.split('\n')
        if (!joined.trim()) continue // empty — retry
        if (split.length === slice.length) {
          lines = split
        } else if (slice.length === 1) {
          lines = [joined]
        } else {
          // Line count shifted — translate each string on its own.
          console.warn(`      [google line mismatch ${split.length}/${slice.length}] falling back to one-by-one`)
          const solo = []
          let soloFailed = false
          for (const text of slice) {
            try {
              solo.push((await googleTranslate([text], targetLang))[0])
            } catch {
              soloFailed = true
              break
            }
          }
          if (soloFailed) {
            throw new EngineError('Google: fallback one-by-one failed', 'transient')
          }
          lines = solo
        }
        googleLimiter.ok()
      } catch (err) {
        if (err?.category) throw err
        // network/timeout — retry the group
      }
    }
    if (lines == null) {
      throw new EngineError('Google: a batch failed after 4 attempts — deferring', 'transient')
    }
    lines.forEach((line, j) => {
      result[start + j] = line
    })
  }
  return result
}

async function libreTranslate(texts, targetLang) {
  const base = (process.env.LIBRETRANSLATE_URL || 'http://localhost:5000').replace(/\/+$/, '')
  let res
  try {
    res = await fetch(`${base}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, source: 'en', target: targetLang, format: 'html' }),
    })
  } catch (err) {
    throw new EngineError(
      `LibreTranslate unreachable at ${base} — is the Docker container running? (${err.message})`,
      'network'
    )
  }
  if (!res.ok) {
    throw categorizeStatus(res.status, await res.text().catch(() => ''), 'LibreTranslate')
  }
  const data = await res.json()
  let out = data?.translatedText
  if (!Array.isArray(out)) out = out ? [out] : []
  if (out.length !== texts.length) {
    throw new EngineError(
      `LibreTranslate returned ${out.length} translations for ${texts.length} texts ` +
        '(target language model missing?)',
      'request'
    )
  }
  return out.map((s) => s ?? '')
}

// Circuit breaker: once the primary engine has failed transiently twice in
// a row (e.g. Google IP block), stop paying the retry cost per batch and
// route everything through the fallback for the rest of the run.
const engineDown = {}
const downStreak = {}

async function callTranslator(texts, cfg) {
  if (cfg.fallback && engineDown[cfg.engine]) {
    return libreTranslate(texts, cfg.fallback.to)
  }
  try {
    if (cfg.engine === 'deepl') return deeplTranslate(texts, cfg.to)
    if (cfg.engine === 'google') return googleTranslate(texts, cfg.to)
    return libreTranslate(texts, cfg.to)
  } catch (err) {
    // Last-resort fallback (e.g. Google blocks the IP mid-run): prefer a
    // lower-grade translation from the local LibreTranslate server over
    // deferring the batch to yet another run. Only for transient errors —
    // auth/quota/request problems are unrelated to availability.
    if (cfg.fallback && err?.category === 'transient') {
      // Trip immediately: every Google failure already burned ~2 minutes of
      // internal retries, so a second confirmation is not worth the cost.
      engineDown[cfg.engine] = true
      downStreak[cfg.engine] = (downStreak[cfg.engine] || 0) + 1
      console.warn(
        `    [fallback] ${cfg.engine} unavailable (${String(err.message).slice(0, 70)}) — using ${cfg.fallback.engine} for the rest of the run`
      )
      return libreTranslate(texts, cfg.fallback.to)
    }
    throw err
  }
}

let deeplAccountLimit = DEEPL_FREE_QUOTA // refreshed at startup from /v2/usage

/**
 * Adaptive throughput governor for DeepL. Free-tier accounts answer 429 on
 * bursts, and the docs say the service relaxes as traffic warms up. We keep
 * a chars/sec budget that is halved on every rate-limit and slowly raised
 * after clean stretches, so a run settles at whatever rate the account
 * actually allows instead of hammering the API.
 */
const deeplThrottle = {
  cps: 200,
  streak: 0,
  /** Called after a successful request; returns ms to wait before the next. */
  afterSuccess(chars) {
    this.streak++
    if (this.streak % 12 === 0) this.cps = Math.min(600, this.cps * 1.2)
    return Math.max(0, (chars / this.cps) * 1000)
  },
  /** Called when a request is rate-limited; returns ms to back off. */
  onRateLimit(attempt) {
    this.streak = 0
    this.cps = Math.max(30, this.cps * 0.5)
    return Math.min(30_000, 3000 * 2 ** Math.min(attempt, 4))
  },
}

const TRANSIENT_ATTEMPTS = 6

/**
 * Translate an array of entries in batches of 20, returning translated
 * strings aligned with the input order (entries whose batch ultimately
 * failed come back undefined). Each entry may carry a { registry } from
 * planText(); if present, placeholders are stitched back to the original
 * Korean/URLs and the locale's junk is stripped. Adds chars submitted on
 * successful requests to stats.chars; failed/deferred entries are counted
 * in stats.failed. Only DeepL is paced + rate-limit adaptive; LibreTranslate
 * (local Docker) runs several requests in flight.
 */
async function translateBatch(entries, cfg, stats) {
  const results = new Array(entries.length)
  const chunks = []
  for (let i = 0; i < entries.length; i += 20) chunks.push(i)
  const concurrency = cfg.engine === 'deepl' || cfg.engine === 'google' ? 1 : 4
  let cursor = 0
  const finish = (value, entry) => {
    if (!entry.registry || entry.registry.length === 0) return sanitize(cfg.locale, value ?? '')
    return sanitize(cfg.locale, stitch(value ?? '', entry.registry))
  }
  const worker = async () => {
    while (cursor < chunks.length) {
      const start = chunks[cursor++]
      const chunkEntries = entries.slice(start, start + 20)
      const texts = chunkEntries.map((e) => e.text)
      if (texts.length === 0) continue

      if (dryRun) {
        // Simulate a translation (stitch placeholders back + a suffix) so
        // planning, skip logic and quota accounting run end-to-end.
        stats.chars += texts.reduce((s, t) => s + t.length, 0)
        texts.forEach((t, j) => {
          results[start + j] = finish(t, chunkEntries[j]) + 'y'
        })
        continue
      }

      // DeepL (and MT generally) occasionally drops, clones or reorders
      // placeholders when it restructures a sentence — verify every
      // protected fragment came back with each tag exactly once, in order.
      const tagsOk = (raw, registry) => {
        if (!registry || registry.length === 0) return true
        const ids = []
        for (const m of raw.matchAll(/<k(\d+)><\/k\d+>/g)) ids.push(Number(m[1]))
        if (ids.length !== registry.length) return false
        for (let n = 0; n < ids.length; n++) if (ids[n] !== n) return false
        return true
      }

      let lastErr = null
      let fatalAfterRetries = false // network errors abort after retries; 429s defer
      for (let attempt = 0; attempt < TRANSIENT_ATTEMPTS; attempt++) {
        try {
          const out = await callTranslator(texts, cfg)
          const chars = texts.reduce((s, t) => s + t.length, 0)
          stats.chars += chars
          const bad = []
          out.forEach((r, j) => {
            const entry = chunkEntries[j]
            if (tagsOk(r, entry.registry)) {
              results[start + j] = finish(r, entry)
            } else {
              bad.push(j)
            }
          })
          if (cfg.engine === 'deepl') {
            const wait = deeplThrottle.afterSuccess(chars)
            if (wait > 0) await sleep(wait)
          }
          stats.blocked = 0 // any success means the throttle is working again
          lastErr = null
          // Re-send only the corrupt fragments, one request each, so the
          // engine has no surrounding text to restructure around them.
          for (const j of bad) {
            const entry = chunkEntries[j]
            let fixed = false
            for (let t = 0; t < 3 && !fixed; t++) {
              if (t > 0) await sleep(1500 * 2 ** t)
              try {
                const [single] = await callTranslator([entry.text], cfg)
                if (tagsOk(single, entry.registry)) {
                  results[start + j] = finish(single, entry)
                  stats.chars += entry.text.length
                  fixed = true
                }
              } catch (err) {
                if (err.category === 'auth' || err.category === 'quota') throw err
                // transient/network — loop retries
              }
            }
            if (!fixed) {
              console.warn(
                `    [corrupt fragment] placeholder tags lost after 3 solo retries — whole file will retry next run`
              )
              stats.failed += 1
            }
          }
          break
        } catch (err) {
          if (err.category === 'network') {
            // Dropped connection — retry with backoff; abort this locale only
            // if the service stays unreachable through every attempt.
            lastErr = err
            fatalAfterRetries = true
            const wait = Math.min(30_000, 2000 * 2 ** Math.min(attempt, 4))
            console.warn(`    [network, attempt ${attempt + 1}/${TRANSIENT_ATTEMPTS}] retrying in ${Math.round(wait / 1000)}s`)
            await sleep(wait)
            continue
          }
          if (err.category === 'transient') {
            // Rate limit / 5xx — back off (halving the budget each time for
            // DeepL) and retry; only give up after every attempt is spent.
            lastErr = err
            const wait =
              cfg.engine === 'deepl'
                ? deeplThrottle.onRateLimit(attempt)
                : Math.min(30_000, 1500 * 2 ** Math.min(attempt, 4))
            console.warn(`    [rate-limit, attempt ${attempt + 1}/${TRANSIENT_ATTEMPTS}] backing off ${Math.round(wait / 1000)}s`)
            await sleep(wait)
            continue
          }
          if (err.category === 'auth' || err.category === 'quota') {
            throw err // systemic — let the caller stop this locale cleanly
          }
          // 'request': this batch is un-translatable — log and keep going.
          console.warn(`    [skip batch] ${err.message.slice(0, 200)}`)
          console.warn(`      preview: ${JSON.stringify(texts.slice(0, 2)).slice(0, 240)}`)
          stats.failed += texts.length
          lastErr = null
          break
        }
      }
      if (lastErr && fatalAfterRetries) throw lastErr
      if (lastErr) {
        // Every retry was rate-limited. Defer the chunk instead of killing
        // the run — lesson files stay unwritten (so the whole file retries
        // on a later run), single keys are simply re-attempted next run.
        stats.blocked = (stats.blocked || 0) + 1
        if (stats.blocked >= 30) {
          throw new EngineError(
            'Rate-limited on 30 consecutive batches despite growing backoff — the account is ' +
              'temporarily throttled hard. Work saved so far will be skipped next run; try again in a few hours.',
            'transient'
          )
        }
        console.warn(`    [defer chunk] ${lastErr.message.slice(0, 140)} — will retry on a later run`)
        stats.failed += texts.length
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, chunks.length) }, worker))
  return results
}

/** Print the account's current monthly usage (free, non-billing endpoint). */
async function checkDeeplQuota() {
  const key = process.env.DEEPL_API_KEY
  const endpoint = key.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/usage'
    : 'https://api.deepl.com/v2/usage'
  try {
    const res = await fetch(endpoint, { headers: { Authorization: `DeepL-Auth-Key ${key}` } })
    if (!res.ok) return
    const u = await res.json()
    if (u?.character_limit) deeplAccountLimit = u.character_limit
    console.log(
      `DeepL monthly quota: ${(u?.character_count ?? 0).toLocaleString()} / ${deeplAccountLimit.toLocaleString()} chars used`
    )
  } catch {
    // Non-fatal: the % display below just falls back to DEEPL_FREE_QUOTA.
  }
}

function report(bucket, stats, cfg) {
  const suffix =
    cfg.engine === 'deepl'
      ? `  (${Math.round((stats.chars / deeplAccountLimit) * 1000) / 10}% of ${deeplAccountLimit.toLocaleString()}/mo)`
      : '  (no monthly cap)'
  console.log(`  ${bucket.padEnd(9)} chars=${String(stats.chars).padStart(7)}${suffix}`)
}

// --------------------------------------------------------------- Bucket A

async function translateMessages(locale, cfg, stats) {
  const en = readJson(join(MESSAGES_DIR, 'en.json'))
  const targetPath = join(MESSAGES_DIR, `${locale}.json`)
  const target = readJson(targetPath)
  const missing = collectLeafKeys(en).filter(
    ({ path }) => !path.split('.').reduce((o, p) => o?.[p], target)
  )
  const entries = missing.map(({ path, text }) => {
    const { tagged, registry } = planText(text)
    return { path, text: tagged, registry, orig: text }
  })
  const results = await translateBatch(entries, cfg, stats)
  entries.forEach(({ path, orig }, i) => {
    const translated = results[i]
    if (translated && translated.trim() && translated.trim() !== orig.trim()) {
      setAtPath(target, path, translated.trim())
    }
  })
  if (!dryRun) writeJson(targetPath, target)
  report('UI strings', stats, cfg)
}

// ------------------------------------------------------------- short content

function loadEnglishCorpus() {
  const dumpScript = join(ROOT, 'scripts', 'i18n', 'dump-en.mts')
  try {
    return JSON.parse(
      execFileSync(process.execPath, ['--import', 'tsx', dumpScript], {
        encoding: 'utf8',
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'inherit'],
      })
    )
  } catch {
    const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    return JSON.parse(execFileSync(npxBin, ['tsx', dumpScript], { encoding: 'utf8', cwd: ROOT }))
  }
}

async function translateContent(locale, cfg, stats) {
  // English corpus snapshot straight from the data modules (never drifts).
  const corpus = loadEnglishCorpus()

  const targetPath = join(CONTENT_DIR, `content.${locale}.json`)
  const target = readJson(targetPath)
  for (const section of ['unit', 'lessons', 'themes', 'topics', 'vocab']) {
    const enSection = corpus[section] || {}
    const current = target[section] || {}
    const entries = Object.entries(enSection)
      .filter(([k]) => !current[k])
      .map(([k, text]) => {
        const { tagged, registry } = planText(text)
        return { path: k, text: tagged, registry, orig: text }
      })
    const results = await translateBatch(entries, cfg, stats)
    entries.forEach(({ path, orig }, i) => {
      const translated = results[i]
      if (translated && translated.trim() && translated.trim() !== orig.trim()) {
        current[path] = translated.trim()
      }
    })
    if (Object.keys(current).length > 0) target[section] = current
  }
  if (!dryRun) writeJson(targetPath, target)
  report('Content', stats, cfg)
}

// ------------------------------------------------------------- Bucket B (md)

function splitBlocks(raw) {
  const lines = raw.split('\n')
  const blocks = []
  let cur = []
  let fence = false
  const flush = () => {
    if (cur.length) {
      blocks.push(cur.join('\n'))
      cur = []
    }
  }
  for (const line of lines) {
    if (/^\s*```/.test(line)) fence = !fence
    if (!fence && line.trim() === '') {
      flush()
      continue
    }
    cur.push(line)
  }
  flush()
  return blocks
}

/** Returns true when the block contains translatable (Latin/English) text. */
function hasEnglishText(block) {
  const withoutTags = block.replace(TAG_RE, '')
  return /[A-Za-z]/.test(withoutTags)
}

/** Leading markdown decoration (heading #, bullets, list numbers). */
function splitLead(text) {
  const m = text.match(/^(\s*(?:#{1,6}\s+|-{1,3}\s+|\d+[.)]\s+)?)/)
  const lead = m?.[1] ?? ''
  return { lead, body: text.slice(lead.length) }
}

const TOKEN_RE = /⟦(\d+)⟧/g

/**
 * Translate a lesson file in two passes: first plan every translatable
 * fragment (table rows, paragraphs, headings), then send them all in a few
 * batched requests, then stitch the results back into the markdown skeleton.
 * The file is only written when every fragment translated; otherwise it is
 * left untouched so the next run retries the whole file.
 * Returns: true (written), false (nothing to do), 'failed' (partial batch).
 */
async function translateLessonFile(unit, file, locale, cfg, stats) {
  const srcPath = join(LESSONS_DIR, unit, file)
  const targetDir = join(LESSONS_DIR, locale, unit)
  const targetPath = join(targetDir, file)
  if (!force && existsSync(targetPath) && readFileSync(targetPath, 'utf8').trim().length > 0) {
    return false
  }

  const srcText = readFileSync(srcPath, 'utf8')
  const blocks = splitBlocks(srcText)
  const plan = [] // { text, registry, orig } fragments to translate, in order
  const skeletonBlocks = []

  const enqueue = (text) => {
    const { tagged, registry } = planText(text)
    const i = plan.length
    plan.push({ text: tagged, registry, orig: text })
    return `⟦${i}⟧`
  }

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed || /^```/.test(trimmed)) {
      skeletonBlocks.push(block)
      continue
    }

    // Table block. Every row is translated cell by cell (LibreTranslate
    // strips the pipes when given a whole row, which corrupts the markdown
    // table). Pure-Korean cells are never sent to the API, so the engine can
    // never reflow or drop Korean across columns.
    if (trimmed.split('\n').every((l) => l.trim().startsWith('|'))) {
      const rows = block.split('\n')
      const outRows = rows.map((row) => {
        if (!hasEnglishText(row)) return row
        return row
          .split('|')
          .map((cell) => {
            const cleaned = cell.trim()
            if (!cleaned || /^:?-{2,}:?$/.test(cleaned) || !hasEnglishText(cleaned)) {
              return cell
            }
            return enqueue(cleaned)
          })
          .join('|')
      })
      skeletonBlocks.push(outRows.join('\n'))
      continue
    }

    // Markdown list block -> translate item by item (whole multi-line list
    // fragments confuse the engines when several Korean phrases are nearby).
    const lines = trimmed.split('\n')
    const isList = lines.every((l) => /^\s*(?:[-*]|\d+[.)])\s+/.test(l))
    if (isList && lines.length > 1) {
      skeletonBlocks.push(
        lines
          .map((line) => {
            if (!hasEnglishText(line)) return line
            const { lead, body } = splitLead(line)
            return lead + enqueue(body)
          })
          .join('\n')
      )
      continue
    }

    // Prose / single-list-item / heading block.
    if (!hasEnglishText(trimmed)) {
      skeletonBlocks.push(block)
      continue
    }
    const { lead, body } = splitLead(trimmed)
    skeletonBlocks.push(lead + enqueue(body))
  }

  if (plan.length === 0) return false

  // Send every planned fragment in batches; align results back by order.
  const results = await translateBatch(plan, cfg, stats)
  const complete = results.every((r) => r !== undefined)
  if (!complete) {
    console.warn(`    [skip file] ${unit}/${file} — partial batch failure, whole file will retry next run`)
    return 'failed'
  }

  let skeleton = skeletonBlocks.join('\n\n')
  let touched = false
  skeleton = skeleton.replace(TOKEN_RE, (_, idx) => {
    const i = Number(idx)
    const translated = results[i]?.trim()
    const original = plan[i].orig.trim()
    if (translated && translated !== original) {
      touched = true
      return translated
    }
    return original
  })

  if (!touched) return false

  if (!dryRun) {
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(targetPath, skeleton)
    const statusPath = join(STATUS_DIR, `review-status.${locale}.json`)
    const status = readJson(statusPath)
    const key = `${unit}:${file.replace(/\.md$/, '')}`
    if (!status[key] || force) {
      status[key] = { translatedAt: new Date().toISOString(), reviewed: false }
      writeJson(statusPath, status)
    }
  }
  return true
}

async function translateLessons(locale, cfg, stats) {
  const units = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^(unit\d+|themes)$/.test(d.name))
    .map((d) => d.name)

  let files = 0
  let failedFiles = 0
  for (const unit of units) {
    const mds = readdirSync(join(LESSONS_DIR, unit)).filter((f) => f.endsWith('.md'))
    for (const file of mds) {
      if (onlyFile && `${unit}/${file.replace(/\.md$/, '')}` !== onlyFile) continue
      const outcome = await translateLessonFile(unit, file, locale, cfg, stats)
      if (outcome === true) {
        files++
        if (!dryRun) console.log(`    ✓ ${unit}/${file}`)
      } else if (outcome === 'failed') {
        failedFiles++
      }
    }
  }
  report('Lessons', stats, cfg)
  console.log(
    `  translated ${files} lesson file(s)${failedFiles ? `, ${failedFiles} deferred (partial failure)` : ''}`
  )
  return files
}

// -------------------------------------------------------------------- main

async function main() {
  if (!dryRun && langs.some((l) => ENGINES[l].engine === 'deepl')) {
    await checkDeeplQuota()
  }
  for (const locale of langs) {
    const cfg = { ...ENGINES[locale], locale }
    console.log(
      `\n=== ${locale} [${cfg.engine} → ${cfg.to}] ${dryRun ? '(DRY RUN — no API, no writes)' : ''} ===`
    )
    const stats = { chars: 0, failed: 0 }
    try {
      await translateMessages(locale, cfg, stats)
      await translateContent(locale, cfg, stats)
      await translateLessons(locale, cfg, stats)
    } catch (err) {
      console.error(`\n[aborted ${locale}] ${err.message}`)
      if (err.category === 'auth')
        console.error('  Check DEEPL_API_KEY in .env (free DeepL keys end in ":fx").')
      if (err.category === 'quota')
        console.error('  Monthly quota reached — everything done so far is saved and will be skipped next month.')
      if (err.category === 'network')
        console.error('  Network error — is LibreTranslate running on port 5000? Is the API reachable?')
    }
    const failedTxt = stats.failed ? ` failed=${stats.failed}` : ''
    console.log(`  -> ${locale}: chars submitted=${stats.chars}${failedTxt}`)
    if (!dryRun) {
      mkdirSync(STATUS_DIR, { recursive: true })
      writeFileSync(
        QUOTA_LOG,
        `${new Date().toISOString()} locale=${locale} engine=${cfg.engine} chars=${stats.chars} failed=${stats.failed}\n`,
        { flag: 'a' }
      )
    }
  }

  console.log(
    dryRun
      ? '\nDry run finished — nothing written, no quota used.'
      : '\nDone. Quota log: scripts/i18n/quota.log'
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
