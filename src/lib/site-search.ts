/**
 * Builds the site-wide search index shared by the SearchBox component:
 *
 *   - every vocabulary word (Korean / romanization / English / zh meaning /
 *     topic / category / tags / concept aliases)
 *   - every lesson (localized + English titles, unit, concept aliases)
 *   - every theme (localized + English titles, concept aliases)
 *   - category suggestions ("weather — 68 words", "colors — 56 words")
 *
 * `withWords` is toggled off for the sidebar, which has no vocabulary loaded
 * yet, so lessons/themes/categories stay instantly available.
 */

import { SearchIndex, type SearchDoc, type SearchField } from '@/lib/search-engine'
import { units, themes } from '@/lib/data'
import {
  localizedLessonTitle,
  localizedThemeTitle,
  localizedTopicName,
} from '@/lib/i18n/content'
import { topics, type VocabularyWord } from '@/lib/vocabulary'
import type { AppLocale } from '@/i18n/routing'
import {
  localizeConcept,
  manualConcepts,
  topicAliases,
  conceptIncludesWord,
  conceptFieldText,
  type LocalizedConcept,
} from '@/lib/search-concepts'

export type SiteDoc = SearchDoc

const weight = (text: string, w: number, tag?: SearchField['tag']): SearchField => ({
  text,
  weight: w,
  tag,
})

function addIf(text: string | undefined, w: number, tag: SearchField['tag']): SearchField[] {
  return text ? [weight(text, w, tag)] : []
}

/** Concepts in data topics that contain at least one word. */
function autoTopicConcepts(
  locale: AppLocale,
  vocabTopics: Set<string>
): LocalizedConcept[] {
const out: LocalizedConcept[] = []
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]
      if (!vocabTopics.has(topic.id)) continue
      const extra = topicAliases.find((t) => t.topicId === topic.id)
      const baseLabel = localizedTopicName(locale, topic.id, topic.name)
      const english = topic.name
      const aliases = Array.from(
        new Set([baseLabel, english, ...(extra?.aliases ?? [])])
      )
      out.push({
        id: `topic:${topic.id}`,
        label: (extra?.label && extra.label[locale]) ?? baseLabel,
        aliases,
        topics: [topic.id],
        themes: topic.id === 'weather' ? ['weather'] : undefined,
      })
    }
    return out
}

export interface BuildSiteIndexOptions {
  locale: AppLocale
  vocabulary: VocabularyWord[]
  zhDict?: Record<string, string>
  /** Rows in the index: words are excluded when off (sidebar). */
  withWords?: boolean
}

/* ------------------------------------------------------------------ */
/* Shared fetch + cache helpers                                        */
/*                                                                     */
/* The vocabulary is fetched once per session and the (heavier) word    */
/* index is built once, then reused by every SearchBox so the sidebar   */
/* and the vocabulary panel never index the 5k-word corpus twice.       */
/* ------------------------------------------------------------------ */

let vocabDataPromise: Promise<VocabularyWord[]> | null = null

export function loadVocabularyData(): Promise<VocabularyWord[]> {
  vocabDataPromise ??= fetch('/vocabulary-data.json').then((r) => r.json())
  return vocabDataPromise
}

const zhDictPromises: Partial<Record<AppLocale, Promise<Record<string, string>>>> = {}

export function loadZhDict(locale: AppLocale): Promise<Record<string, string>> {
  if (locale !== 'zh') return Promise.resolve({})
  zhDictPromises[locale] ??= fetch('/zh-vocab-dict.json')
    .then((r) => r.json())
    .catch(() => ({}))
  return zhDictPromises[locale]!
}

const indexCache = new Map<string, SearchIndex<SiteDoc>>()

/**
 * Memoized build keyed on everything that changes the result, so two
 * components rendering at the same locale share one index construction.
 */
export function getSiteIndex(
  opts: BuildSiteIndexOptions
): SearchIndex<SiteDoc> {
  const key = [
    opts.locale,
    opts.withWords ? 'words' : 'course',
    opts.vocabulary.length,
    Object.keys(opts.zhDict ?? {}).length,
  ].join('|')
  const hit = indexCache.get(key)
  if (hit) return hit
  const index = buildSiteIndex(opts)
  indexCache.set(key, index)
  return index
}

export function buildSiteIndex({
  locale,
  vocabulary,
  zhDict = {},
  withWords = true,
}: BuildSiteIndexOptions): SearchIndex<SiteDoc> {
  const index = new SearchIndex<SiteDoc>()

  const vocabTopics = new Set<string>()
  if (withWords) {
    for (const w of vocabulary) vocabTopics.add(w.topic)
  }
  const concepts = [
    ...autoTopicConcepts(locale, vocabTopics),
    ...manualConcepts.map((c) => localizeConcept(c, locale)),
  ]

  // Lessons mapped to concept targets, so sidebar search finds them via a
  // concept even when the title is localized and no alias appears in it.
  const conceptsForLesson = (id: string) =>
    concepts.filter((c) => c.lessons?.includes(id))
  const conceptsForTheme = (id: string) =>
    concepts.filter((c) => c.themes?.includes(id))

  // Register every category up front so counts accumulate while tagging docs.
  for (const c of concepts) {
    index.addCategory({ id: c.id, label: c.label, aliases: c.aliases })
  }

  // ---- Lessons & themes ------------------------------------------------
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const key = `${unit.id}/${lesson.id}`
      const localized = localizedLessonTitle(locale, unit.id, lesson.id, lesson.title)
      const fields: SearchField[] = [
        weight(localized, 1, 'label'),
        weight(lesson.title, 0.7, 'en'),
        weight(unit.name, 0.5, 'unit'),
      ]
      for (const c of conceptsForLesson(key)) {
        fields.push(weight(conceptFieldText(c), 0.4, 'concept'))
      }
      index.addDoc({
        doc: {
          id: key,
          kind: 'lesson',
          label: localized,
          subtitle: unit.name,
          fields,
          payload: { unitId: unit.id, num: lesson.id, title: lesson.title, unitName: unit.name },
        },
      })
    }
  }

  for (const theme of themes) {
    const localized = localizedThemeTitle(locale, theme.id, theme.title)
    const fields: SearchField[] = [
      weight(localized, 1, 'label'),
      weight(theme.title, 0.7, 'en'),
    ]
    for (const c of conceptsForTheme(theme.id)) {
      fields.push(weight(conceptFieldText(c), 0.4, 'concept'))
    }
    index.addDoc({
      doc: {
        id: `theme:${theme.id}`,
        kind: 'theme',
        label: localized,
        fields,
        payload: { themeId: theme.id, title: theme.title },
      },
    })
  }

  // ---- Words ------------------------------------------------------------
  if (withWords) {
    for (const w of vocabulary) {
      const zh = zhDict[w.korean]
      const fields: SearchField[] = [
        weight(w.korean, 1, 'ko'),
        ...addIf(w.english, 0.95, 'en'),
        ...addIf(w.romanization, 0.7, 'romanization'),
        ...addIf(zh, 0.9, 'zh'),
        weight(localizedTopicName(locale, w.topic, w.topic), 0.4, 'topic'),
      ]
      if (w.category) fields.push(weight(w.category, 0.3, 'category'))
      if (w.tags && w.tags.length > 0) {
        fields.push(weight(w.tags.join(' '), 0.3, 'tags'))
      }

      const categoryIds: string[] = []
      for (const c of concepts) {
        if (conceptIncludesWord(c, w, zh)) {
          categoryIds.push(c.id)
          fields.push(weight(conceptFieldText(c), 0.3, 'concept'))
        }
      }

      index.addDoc({
        doc: {
          id: w.id,
          kind: 'word',
          label: w.korean,
          subtitle: [w.romanization, zh ?? w.english].filter(Boolean).join(' · '),
          fields: fields.filter((f) => f.text),
          payload: { word: w },
        },
        categoryIds,
      })
    }
  }

  return index
}