import { units, themes } from '@/lib/data'
import { topics, vocabulary, type VocabularyWord } from '@/lib/vocabulary'
import type { AppLocale } from '@/i18n/routing'
import zh from './content.zh.json'

/**
 * Per-language content sidecars. English is the source of truth and is never
 * stored here — a missing key falls back to the data in @/lib/data and
 * @/lib/vocabulary.
 *
 * Shape of each file:
 *   {
 *     "unit":    { "<unitId>": "<translated unit title>" },
 *     "lessons": { "<unitId>:<lessonId>": "<translated lesson title>" },
 *     "themes":  { "<themeId>": "<translated theme title>" },
 *     "topics":  { "<topicId>": "<translated topic name>" },
 *     "vocab":   { "<wordId>": "<translated meaning>" }
 *   }
 */
export interface ContentSidecar {
  unit?: Record<string, string>
  lessons?: Record<string, string>
  themes?: Record<string, string>
  topics?: Record<string, string>
  vocab?: Record<string, string>
}

const SIDECARS: Partial<Record<AppLocale, ContentSidecar>> = {
  zh: zh as ContentSidecar,
}

export function sidecar(locale: AppLocale): ContentSidecar | undefined {
  return SIDECARS[locale]
}

function findLessonEn(unitId: string, lessonId: number | string) {
  const unit = units.find((u) => u.id === unitId)
  return unit?.lessons.find((l) => l.id === lessonId)
}

export function localizedUnitTitle(
  locale: AppLocale,
  unitId: string,
  fallback?: string
): string {
  return (
    sidecar(locale)?.unit?.[unitId] ??
    fallback ??
    units.find((u) => u.id === unitId)?.title ??
    unitId
  )
}

export function localizedLessonTitle(
  locale: AppLocale,
  unitId: string,
  lessonId: number | string,
  fallback?: string
): string {
  if (unitId === 'themes') {
    return localizedThemeTitle(locale, String(lessonId), fallback)
  }
  const key = `${unitId}:${lessonId}`
  return (
    sidecar(locale)?.lessons?.[key] ??
    fallback ??
    findLessonEn(unitId, lessonId)?.title ??
    key
  )
}

export function localizedThemeTitle(
  locale: AppLocale,
  themeId: string,
  fallback?: string
): string {
  return (
    sidecar(locale)?.themes?.[themeId] ??
    fallback ??
    themes.find((t) => t.id === themeId)?.title ??
    themeId
  )
}

export function localizedTopicName(
  locale: AppLocale,
  topicId: string,
  fallback?: string
): string {
  return (
    sidecar(locale)?.topics?.[topicId] ??
    fallback ??
    topics.find((t) => t.id === topicId)?.name ??
    topicId
  )
}

export function localizedVocabMeaning(
  locale: AppLocale,
  word: VocabularyWord,
  zhDict?: Record<string, string>
): string {
  if (locale === 'zh' && zhDict?.[word.korean]) {
    return zhDict[word.korean]
  }
  return sidecar(locale)?.vocab?.[word.id] ?? word.english
}

/** English lookup tables used by the translation tooling (dump step). */
export const englishContent = {
  unit: Object.fromEntries(units.map((u) => [u.id, u.title])),
  lessons: Object.fromEntries(
    units.flatMap((u) =>
      u.lessons.map((l) => [`${u.id}:${l.id}`, l.title])
    )
  ),
  themes: Object.fromEntries(themes.map((t) => [t.id, t.title])),
  topics: Object.fromEntries(topics.map((t) => [t.id, t.name])),
  vocab: Object.fromEntries(vocabulary.map((w) => [w.id, w.english])),
}
