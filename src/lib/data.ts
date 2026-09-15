export interface Lesson {
  id: number
  title: string
}

export interface Unit {
  id: string
  name: string
  title: string
  icon: string
  lessons: Lesson[]
}

export interface Theme {
  id: string
  title: string
  icon: string
}

export function getLessonTitle(unit: number, lesson: number): string {
  const titles: Record<number, Record<number, string>> = {
    1: {
      1: 'Korean Word Order & Particles', 2: 'Particles 이/가 & 있다', 3: 'Korean Verbs & Adjectives',
      4: 'Adjective Conjugation ㄴ/은', 5: 'Past, Present & Future Tense', 6: 'Korean Honorifics',
      7: 'Korean Irregulars', 8: 'Adverbs & Negatives', 9: 'Conjugating 이다', 10: 'Korean Numbers & Counters',
      11: 'Time Words', 12: 'Particles: 들, 만, 에서, 부터, 까지', 13: 'Particles: and, with, to, from',
      14: 'Korean Passive Verbs', 15: 'Miscellaneous Grammar', 16: '적, 스럽다 & Homonyms',
      17: '~고 & ~고 싶다', 18: 'Present Progressive ~고 있다', 19: 'Comparatives & Superlatives',
      20: 'Well, Poorly, Wrongly', 21: 'Question Words: why, when, where, who',
      22: 'Question Words: how, what, which', 23: 'ㅎ Irregular & Colors', 24: 'Before, After, Since, Within',
      25: 'Anybody, Anywhere, Nothing...'
    },
    2: {
      1: 'Using ~는 것', 2: '~던 & ~었/았던', 3: 'Anomalies with ~는 것',
      4: '~기 & ~ㅁ/음 to Make Nouns', 5: 'Using 지 as a Noun', 6: '~는 것 + 이다',
      7: '~려고/~러 & ~아/어 보다', 8: 'The Special Noun 중', 9: 'Difficult Words: 자기, 훨씬...',
      10: '~ㄹ 것 같다', 11: '~같이 보이다 & 아/어 보이다', 12: '~아/어서 (Because)',
      13: '~기 때문에 (Because)', 14: 'Honorific: 시 & Honorific Words', 15: 'Imperative Mood',
      16: 'To Give, To Do For', 17: '~ㄹ 때 (When)', 18: '~(으)면 (If/When)',
      19: "Let's: ~자 & ~ㅂ/읍시다", 20: 'Can/Cannot: ~ㄹ 수 있다', 21: 'Must: ~아/어 야 하다',
      22: 'Even Though: ~지만', 23: 'Regardless: ~아/어도', 24: 'May I: ~아/어도 되다',
      25: 'Scheduled/Planned/Ready'
    },
    3: {
      1: '~하기도 하고', 2: 'Quoted Sentences', 3: "I Said Let's: ~자고",
      4: 'Quoting Imperatives', 5: '아/어 달라고', 6: 'To Make/Let: ~게 하다',
      7: 'To Make: ~시키다', 8: 'Or: ~(이)나, ~거나', 9: 'Difficult Words: 어쩌면...',
      10: 'Difficult Words: 차다, 가득...', 11: 'To Hope/Wish', 12: '~(으)면서 (While)',
      13: '~ㄹ/을까 & ~ㄹ/을게요', 14: '~ㄹ/을까요? (Do you think)', 15: "~ㄹ/을까 봐 (I'm worried)",
      16: 'Almost: 거의 & ~ㄹ/을 뻔하다', 17: 'Like: ~처럼', 18: 'The Only: 유일하다',
      19: 'Nothing but: ~밖에', 20: 'Clause Connector: 아/어', 21: 'To Include/Exclude',
      22: 'As Much As: 만큼', 23: 'Instead: 대신(에)', 24: "It Doesn't Matter", 25: "I Don't Care"
    },
    4: {
      1: '데 vs 때', 2: 'More ~는데 vs ~는 데', 3: 'According to/Due to',
      4: 'Difficult Words: 그대로...', 5: 'Should Not/Must Not', 6: 'Because of: ~(으)니까',
      7: 'Expressing Surprise: ~구나', 8: 'Expressing Surprise: ~네(요)', 9: 'As Soon As: ~자마자',
      10: 'To Know How: ~ㄹ/을 줄 알다', 11: 'Negating with 아니', 12: 'To Decide: ~기로 하다',
      13: 'The Many Meanings of ~다가', 14: 'Comparing with Magnitudes', 15: 'Emphasizing: ~잖아(요)',
      16: 'The Many Meanings of ~거든', 17: 'The Many Meanings of ~도록', 18: 'The Many Meanings of ~지/죠',
      19: 'To End Up: ~게 되다', 20: 'Only/Just: 뿐, 뿐만 아니라', 21: 'If You Want: ~(으)려면',
      22: '갖다 vs 가지다', 23: 'To Pretend: ~척하다', 24: 'Even If: ~더라도', 25: '~ㄹ/을 텐데 & 테니'
    },
    5: {
      1: 'Internet Slang & Abbreviations', 2: 'Abbreviating Quotations', 3: '약, 한, ~(으)므로, 전반',
      4: '~는/은 Revisited', 5: 'Important Principles', 6: 'Listing Possibilities: ~든지',
      7: '~도 Revisited', 8: 'Past Perfect: ~았/었었다', 9: '~나 보다 (It appears)',
      10: '어쩔 수 없다 (Nothing to do)', 11: 'At Least: ~(이)라도', 12: 'On the Humble Side',
      13: "On One's Way: ~가/오는 길", 14: 'While Already: ~는 김', 15: "Shouldn't Have: ~ㄹ/을걸",
      16: 'While in State: ~ㄴ/은 채', 17: 'Introduction to ~더~', 18: 'From Experience: ~더라',
      19: 'To Notice: ~더니', 20: 'Emotion After Hearing: ~다니', 21: 'If You Do: ~다 보면',
      22: 'While Doing: ~다 보니', 23: 'Now That: ~아/어 보니', 24: 'To Be Worth: ~ㄹ/을 만하다',
      25: 'I Said That: ~다니까'
    },
    6: {
      1: 'Grouped By: ~별로', 2: 'To Be Like: ~다운', 3: 'In Other Words: ~이라고 하다',
      4: 'Intentionally/Unintentionally', 5: 'No Matter What/Who/How', 6: 'Right After: ~기가 무섭게',
      7: 'To the Point: ~까지 하다', 8: 'By the Time: ~ㄹ/을 즈음에', 9: 'Difficult Words',
      10: 'Difficult Words II', 11: 'Being In a State: ~아/어 있다', 12: 'To Try: ~아/어 보다 Revisited',
      13: 'How It Works: ~는法', 14: 'In the Process Of: ~는 중', 15: 'To Not Know If: ~ㄹ/을지 모르다',
      16: 'In Front Of/Behind/Under', 17: 'Before It Gets To: ~ㄹ/을 리가 없다', 18: 'To Be Supposed To',
      19: 'I Heard: ~ㄴ/는다고 하다', 20: 'Whatever/Whoever: ~든', 21: 'Just Because: ~다고 해서',
      22: 'I Wonder If: ~ㄹ/을까', 23: 'To Be Accustomed: ~아/어 대다', 24: 'The More A, The More B',
      25: 'Final Lesson: Review'
    },
    7: {
      1: 'Even More Advanced Particles', 2: 'Advanced Quotations', 3: 'Advanced Expressions',
      4: 'To Not Be Able To Help', 5: 'Advanced Suffixes', 6: 'In a Way: ~식으로',
      7: 'To Be Caught Up In', 8: 'Advanced Connectors', 9: 'Difficult Words III',
      10: 'Advanced Grammar I', 11: 'Advanced Grammar II', 12: 'Advanced Grammar III',
      13: 'Advanced Grammar IV', 14: 'Advanced Grammar V', 15: 'Advanced Grammar VI',
      16: 'Advanced Grammar VII', 17: 'Advanced Grammar VIII', 18: 'Advanced Grammar IX',
      19: 'Advanced Grammar X', 20: 'Advanced Grammar XI', 21: 'Advanced Grammar XII',
      22: 'Advanced Grammar XIII', 23: 'Advanced Grammar XIV', 24: 'Advanced Grammar XV',
      25: 'Final Review'
    },
    8: {
      1: 'Mastering Particles', 2: 'Advanced Verb Forms', 3: 'Complex Sentences',
      4: 'Advanced Honorifics', 5: 'Formal vs Informal', 6: 'Advanced Expressions I',
      7: 'Advanced Expressions II', 8: 'Advanced Expressions III', 9: 'Advanced Expressions IV',
      10: 'Advanced Expressions V', 11: 'Advanced Expressions VI', 12: 'Advanced Expressions VII',
      13: 'Advanced Expressions VIII', 14: 'Advanced Expressions IX', 15: 'Advanced Expressions X',
      16: 'Advanced Expressions XI', 17: 'Advanced Expressions XII', 18: 'Advanced Expressions XIII',
      19: 'Advanced Expressions XIV', 20: 'Advanced Expressions XV', 21: 'Advanced Expressions XVI',
      22: 'Advanced Expressions XVII', 23: 'Advanced Expressions XVIII', 24: 'Advanced Expressions XIX',
      25: 'Final Mastery Review'
    }
  }
  return titles[unit]?.[lesson] || `Lesson ${lesson}`
}

export const units: Unit[] = [
  {
    id: 'unit0', name: 'Unit 0', title: 'Learn to Read Korean', icon: 'BookOpen',
    lessons: [{ id: 1, title: 'Consonants & Vowels' }, { id: 2, title: 'More Consonants' }, { id: 3, title: 'Diphthongs & Pronunciation' }]
  },
  {
    id: 'unit1', name: 'Unit 1', title: 'Basic Korean Grammar', icon: 'Languages',
    lessons: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, title: getLessonTitle(1, i + 1) }))
  },
  {
    id: 'unit2', name: 'Unit 2', title: 'Lower-Intermediate', icon: 'MessageSquare',
    lessons: Array.from({ length: 25 }, (_, i) => ({ id: i + 26, title: getLessonTitle(2, i + 1) }))
  },
  {
    id: 'unit3', name: 'Unit 3', title: 'Intermediate Grammar', icon: 'BookOpen',
    lessons: Array.from({ length: 25 }, (_, i) => ({ id: i + 51, title: getLessonTitle(3, i + 1) }))
  },
  {
    id: 'unit4', name: 'Unit 4', title: 'Upper Intermediate', icon: 'GraduationCap',
    lessons: Array.from({ length: 25 }, (_, i) => ({ id: i + 76, title: getLessonTitle(4, i + 1) }))
  },
  {
    id: 'unit5', name: 'Unit 5', title: 'Lower Advanced', icon: 'FlaskConical',
    lessons: Array.from({ length: 25 }, (_, i) => ({ id: i + 101, title: getLessonTitle(5, i + 1) }))
  },
  {
    id: 'unit6', name: 'Unit 6', title: 'Advanced Grammar', icon: 'Brain',
    lessons: Array.from({ length: 25 }, (_, i) => ({ id: i + 126, title: getLessonTitle(6, i + 1) }))
  },
  {
    id: 'unit7', name: 'Unit 7', title: 'Advanced Grammar II', icon: 'Sparkles',
    lessons: Array.from({ length: 25 }, (_, i) => ({ id: i + 151, title: getLessonTitle(7, i + 1) }))
  },
  {
    id: 'unit8', name: 'Unit 8', title: 'Advanced Grammar III', icon: 'Trophy',
    lessons: Array.from({ length: 25 }, (_, i) => ({ id: i + 176, title: getLessonTitle(8, i + 1) }))
  }
]

export const themes: Theme[] = [
  { id: 'school', title: 'School', icon: 'School' },
  { id: 'transportation', title: 'Transportation', icon: 'Bus' },
  { id: 'eating', title: 'Eating & Food', icon: 'UtensilsCrossed' },
  { id: 'shopping', title: 'Shopping', icon: 'ShoppingBag' },
  { id: 'weather', title: 'Weather', icon: 'CloudSun' }
]

export const XP_PER_LESSON = 25
export const XP_PER_LEVEL = 200

export function getTotalLessons(): number {
  let total = 0
  units.forEach(u => total += u.lessons.length)
  total += themes.length
  return total
}