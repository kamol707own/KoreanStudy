/**
 * Semantic categories that make *searching a concept* return every related
 * word, the way Typesense does with synonym sets:
 *
 *   "color"  -> every color word in the dictionary
 *   "number" -> every number/count word, plus the numbers lesson
 *   "weather" -> every weather word (topic-backed), plus the Weather theme
 *
 * Membership is either:
 *   - topic-backed  — the word's `topic` field (weather, food, family, ...), or
 *   - keyword-backed — a curated list of English/Korean substrings the word's
 *                      meaning must contain (colors, numbers, animals, ...).
 *
 * Categories also carry a `field` string appended to each member *document*:
 * a low-weight searchable field containing the canonical label + aliases, so a
 * query like "색" or "颜色" lands on every color word even when that term never
 * appears in the word's own meaning.
 */

import type { VocabularyWord } from '@/lib/vocabulary'
import type { AppLocale } from '@/i18n/routing'

export interface ConceptDef {
  id: string
  /** Primary label, e.g. "Colors" in the en UI and "颜色" in zh. */
  label: Record<AppLocale, string>
  /**
   * Trigger words (en / Korean / zh). Matching one opens the category in the
   * search dropdown and expands every member document.
   */
  aliases: string[]
  /** Topic ids that make a word a member (word.topic === one of these). */
  topics?: string[]
  /** Substring keywords a word's meaning (ko/en/zh) must contain. */
  keywords?: {
    ko?: string[]
    en?: string[]
    zh?: string[]
  }
  /** Lessons (`unitId/num`) that belong to this concept (sidebar results). */
  lessons?: string[]
  /** Theme ids that belong to this concept (sidebar results). */
  themes?: string[]
}

const ko = (arr: string[]) => ({ ko: arr })
const en = (arr: string[]) => ({ en: arr })
const kw = (...parts: Array<Partial<{ ko: string[]; en: string[]; zh: string[] }>>) =>
  Object.assign({}, ...parts) as { ko?: string[]; en?: string[]; zh?: string[] }

/**
 * The part of a concept membership that sets are broad enough to be safe on
 * substring checks — first/precise terms only. Less specific single-syllable
 * Korean (이, 삼, 사람…) is deliberately excluded to avoid noisy matches.
 */
export const manualConcepts: ConceptDef[] = [
  {
    id: 'colors',
    label: { en: 'Colors', zh: '颜色' },
    aliases: ['color', 'colour', 'colors', 'colours', '색', '색깔', '색상', '颜色', '色彩'],
    keywords: kw(
      en([
        'color', 'colour', 'colored', 'coloured',
        'red', 'blue', 'green', 'yellow', 'black', 'white',
        'purple', 'pink', 'orange', 'brown', 'gray', 'grey',
        'gold', 'silver', 'beige', 'teal', 'navy', 'violet',
        'indigo', 'turquoise', 'cyan', 'magenta', 'scarlet', 'crimson',
      ]),
      ko(['색', '빛', '금색', '은색', '자주색', '연둣빛', '보랏빛', '장밋빛'])
    ),
    lessons: ['unit1/23'], // "ㅎ Irregular & Colors"
  },
  {
    id: 'numbers',
    label: { en: 'Numbers', zh: '数字' },
    aliases: ['number', 'numbers', 'count', 'counting', 'numeral', 'numerals', '숫자', '数字', '数量'],
    keywords: kw(
      en([
        'number', 'numbers', 'count', 'counting', 'counted',
        'digit', 'hundred', 'thousand', 'million', 'billion',
        'dozen', 'numeral', 'cardinal', 'ordinal',
      ]),
      ko(['숫자', '짝수', '홀수', '개수', '명수', '횟수', '수십', '수백', '수천', '수만', '수억', '수조', '몇', '세다', '셈'])
    ),
    lessons: ['unit1/10'], // "Korean Numbers & Counters"
  },
  {
    id: 'animals',
    label: { en: 'Animals', zh: '动物' },
    aliases: ['animal', 'animals', 'pet', 'pets', '동물', '动物', '動物'],
    keywords: kw(
      en([
        'animal', 'dog', 'puppy', 'cat', 'kitten', 'bird', 'fish', 'horse', 'cow',
        'pig', 'rabbit', 'tiger', 'lion', 'duck', 'chicken', 'bear', 'monkey',
        'elephant', 'sheep', 'goat', 'fox', 'wolf', 'deer', 'mouse', 'rat',
      ]),
      ko(['동물', '강아지', '고양이', '새', '물고기', '말', '소', '돼지', '토끼', '호랑이', '사자', '오리', '닭'])
    ),
  },
  {
    id: 'emotions',
    label: { en: 'Feelings', zh: '情感' },
    aliases: ['emotion', 'emotions', 'feeling', 'feelings', '감정', '情绪'],
    keywords: kw(
      en([
        'feeling', 'feelings', 'emotion', 'emotions', 'happy', 'sad', 'angry',
        'excited', 'nervous', 'worried', 'jealous', 'frustrated', 'surprised',
        'disappointed', 'proud', 'embarrassed', 'lonely', 'bored', 'tired',
      ]),
      ko(['기분', '감정', '행복', '슬프', '화나', '기쁘', '무섭', '부끄럽', '심심'])
    ),
  },
  {
    id: 'clothes',
    label: { en: 'Clothing', zh: '服装' },
    aliases: ['clothes', 'clothing', 'outfit', '웃', '옷', '服装', '衣服'],
    keywords: kw(
      en([
        'clothes', 'clothing', 'shirt', 'pants', 'shoes', 'coat', 'jacket', 'hat',
        'socks', 'skirt', 'dress', 'sweater', 'scarf', 'gloves', 'uniform',
      ]),
      ko(['옷', '셔츠', '바지', '신발', '코트', '모자', '스웨터'])
    ),
  },
]

/** Extra aliases folded into auto topic-backed categories (id = `topic:<id>`). */
export interface TopicAlias {
  topicId: string
  aliases: string[]
  /** Less precise fallback labels per UI locale, used for the dropdown row. */
  label?: Record<AppLocale, string>
}

export const topicAliases: TopicAlias[] = [
  {
    topicId: 'weather',
    aliases: ['weather', 'climate', 'forecast', '날씨', '기후', '天气', '气象', '天気'],
    label: { en: 'Weather', zh: '天气' },
  },
  {
    topicId: 'food',
    aliases: ['food', 'drink', 'eat', 'eating', 'meal', '음식', '식사', '먹다', '食物', '饮食', '食べ物'],
    label: { en: 'Food & Drink', zh: '食物与饮料' },
  },
  {
    topicId: 'time',
    aliases: ['time', 'times', 'clock', 'schedule', '시간', '时间'],
    label: { en: 'Time', zh: '时间' },
  },
  {
    topicId: 'body',
    aliases: ['body', 'health', '身體', '身体', '몸', '건강'],
    label: { en: 'Body & Health', zh: '身体与健康' },
  },
]

export interface LocalizedConcept {
  id: string
  label: string
  aliases: string[]
  topics?: string[]
  keywords?: { ko?: string[]; en?: string[]; zh?: string[] }
  lessons?: string[]
  themes?: string[]
}

/** Localizes a single concept for a UI locale. */
export function localizeConcept(concept: ConceptDef, locale: AppLocale): LocalizedConcept {
  return {
    id: concept.id,
    label: concept.label[locale] ?? concept.label.en,
    aliases: concept.aliases,
    topics: concept.topics,
    keywords: concept.keywords,
    lessons: concept.lessons,
    themes: concept.themes,
  }
}

const WORD_CONTAINS = (hay: string, needles: string[] | undefined): boolean =>
  !!needles && needles.some((n) => hay.includes(n))

/**
 * Does this word belong to the concept? Topic memberships are exact; keyword
 * memberships are substring matches against the word's meaning in every
 * language we know.
 */
export function conceptIncludesWord(
  concept: Pick<ConceptDef, 'topics' | 'keywords'>,
  word: VocabularyWord,
  zhMeaning?: string
): boolean {
  if (concept.topics && concept.topics.includes(word.topic)) return true
  const kws = concept.keywords
  if (!kws) return false

  const koHit = WORD_CONTAINS(word.korean, kws.ko)
  const enHit = WORD_CONTAINS(word.english.toLowerCase(), kws.en)
  const zhHit = zhMeaning ? WORD_CONTAINS(zhMeaning, kws.zh) : false
  return koHit || enHit || zhHit
}

/**
 * Searchable field text appended to every member document. Contains the
 * category label + aliases so a *concept-level* query (색, 颜色, color) hits the
 * whole set, while a single item (red) only matches words containing "red".
 */
export function conceptFieldText(
  concept: { label: string; aliases: string[] }
): string {
  return [concept.label, ...concept.aliases].join(' ')
}