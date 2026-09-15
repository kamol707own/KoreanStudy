#!/usr/bin/env node
/**
 * Finds translated lesson files whose Korean content no longer matches the
 * English source (words dropped, duplicated or altered) and prints them.
 * Run before re-translating a locale so only healthy files are kept — e.g.
 * after a quota reset:
 *
 *   node scripts/i18n/prune-corrupt.mjs zh            # list damaged files
 *   node scripts/i18n/prune-corrupt.mjs zh --delete   # remove them
 *
 * Then re-run: node scripts/i18n/translate.mjs --langs zh
 * (Skip logic leaves healthy files untouched, so only the pruned files are
 * re-translated.)
 */
import { existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const HANGUL_RE = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF]+/g
const LESSONS_DIR = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') + 'public/lessons'

const locale = process.argv[2]
const doDelete = process.argv.includes('--delete')
if (!locale || locale === 'en') {
  console.error('usage: node scripts/i18n/prune-corrupt.mjs <locale> [--delete]')
  process.exit(1)
}

const toSorted = (arr) => [...arr].sort()
const multisetEqual = (a, b) => {
  const A = toSorted(a)
  const B = toSorted(b)
  return A.length === B.length && A.every((x, i) => x === B[i])
}

const units = readdirSync(LESSONS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^(unit\d+|themes)$/.test(d.name))
  .map((d) => d.name)

let bad = 0
let good = 0
const damaged = []
for (const unit of units) {
  const localeDir = join(LESSONS_DIR, locale, unit)
  if (!existsSync(localeDir)) continue
  for (const file of readdirSync(localeDir).filter((f) => f.endsWith('.md'))) {
    const enPath = join(LESSONS_DIR, unit, file)
    const zhPath = join(localeDir, file)
    if (!existsSync(enPath)) continue
    const en = readFileSync(enPath, 'utf8').match(HANGUL_RE) || []
    const zh = readFileSync(zhPath, 'utf8').match(HANGUL_RE) || []
    if (multisetEqual(en, zh)) {
      good++
    } else {
      bad++
      damaged.push(`${unit}/${file.replace(/\.md$/, '')}`)
    }
  }
}

console.log(`\n${locale}: ${good} healthy, ${bad} damaged (Korean multiset mismatch)`)
if (damaged.length) {
  console.log(damaged.map((f) => `  ${f}`).join('\n'))
  if (doDelete) {
    for (const f of damaged) {
      const p = join(LESSONS_DIR, locale, f + '.md')
      unlinkSync(p)
      console.log(`  deleted ${p}`)
    }
    console.log('\nRe-run the translator to regenerate them (skip logic keeps the rest).')
  }
}
