export interface VocabularyWord {
  id: string
  korean: string
  romanization: string
  english: string
  category: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'grammar'
  unit: number | string
  lesson: number | string
  topic: string
  tags: string[]
}

export interface Topic {
  id: string
  name: string
  icon: string
}

export const topics: Topic[] = [
  { id: 'greetings', name: 'Greetings & Etiquette', icon: 'Hand' },
  { id: 'numbers', name: 'Numbers & Counting', icon: 'Hash' },
  { id: 'family', name: 'Family & Relationships', icon: 'Users' },
  { id: 'food', name: 'Food & Drink', icon: 'UtensilsCrossed' },
  { id: 'colors', name: 'Colors', icon: 'Palette' },
  { id: 'time', name: 'Time & Date', icon: 'Clock' },
  { id: 'weather', name: 'Weather & Nature', icon: 'CloudSun' },
  { id: 'school', name: 'School & Education', icon: 'GraduationCap' },
  { id: 'body', name: 'Body & Health', icon: 'Heart' },
  { id: 'animals', name: 'Animals', icon: 'Cat' },
  { id: 'shopping', name: 'Shopping & Money', icon: 'ShoppingBag' },
  { id: 'transport', name: 'Transportation', icon: 'Bus' },
  { id: 'home', name: 'Home & Buildings', icon: 'Home' },
  { id: 'clothing', name: 'Clothing', icon: 'Shirt' },
  { id: 'work', name: 'Work & Jobs', icon: 'Briefcase' },
  { id: 'emotions', name: 'Emotions & Feelings', icon: 'Smile' },
  { id: 'verbs', name: 'Common Verbs', icon: 'Zap' },
  { id: 'adjectives', name: 'Adjectives & Descriptions', icon: 'Star' },
  { id: 'adverbs', name: 'Adverbs', icon: 'ArrowRight' },
  { id: 'particles', name: 'Particles & Grammar', icon: 'BookOpen' },
  { id: 'phrases', name: 'Useful Phrases', icon: 'MessageSquare' },
  { id: 'technology', name: 'Technology', icon: 'Smartphone' },
  { id: 'sports', name: 'Sports & Hobbies', icon: 'Trophy' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Music' },
  { id: 'travel', name: 'Travel & Directions', icon: 'Map' },
  { id: 'nature', name: 'Nature & Environment', icon: 'TreePine' },
  { id: 'culture', name: 'Korean Culture', icon: 'Landmark' },
]

export const vocabulary: VocabularyWord[] = [
  // ========== UNIT 0: Learn to Read Korean ==========
  // Lesson 1: Consonants & Vowels
  { id: 'v001', korean: 'ㄱ', romanization: 'g/k', english: 'Consonant (g/k)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v002', korean: 'ㄴ', romanization: 'n', english: 'Consonant (n)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v003', korean: 'ㄷ', romanization: 'd/t', english: 'Consonant (d/t)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v004', korean: 'ㄹ', romanization: 'r/l', english: 'Consonant (r/l)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v005', korean: 'ㅁ', romanization: 'm', english: 'Consonant (m)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v006', korean: 'ㅂ', romanization: 'b/p', english: 'Consonant (b/p)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v007', korean: 'ㅅ', romanization: 's', english: 'Consonant (s)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v008', korean: 'ㅇ', romanization: 'ng/-', english: 'Consonant (ng/silent)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v009', korean: 'ㅈ', romanization: 'j', english: 'Consonant (j)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v010', korean: 'ㅎ', romanization: 'h', english: 'Consonant (h)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v011', korean: 'ㅏ', romanization: 'a', english: 'Vowel (a)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v012', korean: 'ㅓ', romanization: 'eo', english: 'Vowel (eo)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v013', korean: 'ㅗ', romanization: 'o', english: 'Vowel (o)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v014', korean: 'ㅜ', romanization: 'u', english: 'Vowel (u)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v015', korean: 'ㅡ', romanization: 'eu', english: 'Vowel (eu)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },
  { id: 'v016', korean: 'ㅣ', romanization: 'i', english: 'Vowel (i)', category: 'grammar', unit: 'unit0', lesson: 1, topic: 'particles', tags: ['hangul'] },

  // ========== UNIT 1: Basic Korean Grammar ==========
  // Lesson 1: Korean Word Order & Particles
  { id: 'v017', korean: '나', romanization: 'na', english: 'I (informal)', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['pronoun', 'informal'] },
  { id: 'v018', korean: '저', romanization: 'jeo', english: 'I (formal)', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['pronoun', 'formal'] },
  { id: 'v019', korean: '너', romanization: 'neo', english: 'You (informal)', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['pronoun', 'informal'] },
  { id: 'v020', korean: '당신', romanization: 'dangsin', english: 'You (formal)', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['pronoun', 'formal'] },
  { id: 'v021', korean: '이', romanization: 'i', english: 'This', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['demonstrative'] },
  { id: 'v022', korean: '그', romanization: 'geu', english: 'That (near)', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['demonstrative'] },
  { id: 'v023', korean: '저것', romanization: 'jeogeot', english: 'That (far)', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['demonstrative'] },
  { id: 'v024', korean: '여기', romanization: 'yeogi', english: 'Here', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['location'] },
  { id: 'v025', korean: '거기', romanization: 'geogi', english: 'There', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['location'] },
  { id: 'v026', korean: '저기', romanization: 'jeogi', english: 'Over there', category: 'noun', unit: 'unit1', lesson: 1, topic: 'greetings', tags: ['location'] },

  // Lesson 2: Particles 이/가 & 있다
  { id: 'v027', korean: '있다', romanization: 'itda', english: 'To exist/have', category: 'verb', unit: 'unit1', lesson: 2, topic: 'verbs', tags: ['existence'] },
  { id: 'v028', korean: '없다', romanization: 'eopda', english: 'To not exist/have', category: 'verb', unit: 'unit1', lesson: 2, topic: 'verbs', tags: ['existence', 'negative'] },

  // Lesson 3: Korean Verbs & Adjectives
  { id: 'v029', korean: '가다', romanization: 'gada', english: 'To go', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic'] },
  { id: 'v030', korean: '오다', romanization: 'oda', english: 'To come', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic'] },
  { id: 'v031', korean: '먹다', romanization: 'meokda', english: 'To eat', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic', 'food'] },
  { id: 'v032', korean: '마시다', romanization: 'masida', english: 'To drink', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic', 'food'] },
  { id: 'v033', korean: '보다', romanization: 'boda', english: 'To see/watch', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic'] },
  { id: 'v034', korean: '하다', romanization: 'hada', english: 'To do', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic'] },
  { id: 'v035', korean: '되다', romanization: 'doeda', english: 'To become', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic'] },
  { id: 'v036', korean: '알다', romanization: 'alda', english: 'To know', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic'] },
  { id: 'v037', korean: '모르다', romanization: 'moreuda', english: 'To not know', category: 'verb', unit: 'unit1', lesson: 3, topic: 'verbs', tags: ['basic', 'negative'] },
  { id: 'v038', korean: '좋다', romanization: 'jota', english: 'To be good', category: 'adjective', unit: 'unit1', lesson: 3, topic: 'adjectives', tags: ['basic'] },
  { id: 'v039', korean: '나쁘다', romanization: 'nappeuda', english: 'To be bad', category: 'adjective', unit: 'unit1', lesson: 3, topic: 'adjectives', tags: ['basic', 'irregular'] },
  { id: 'v040', korean: '크다', romanization: 'keuda', english: 'To be big', category: 'adjective', unit: 'unit1', lesson: 3, topic: 'adjectives', tags: ['basic'] },
  { id: 'v041', korean: '작다', romanization: 'jakda', english: 'To be small', category: 'adjective', unit: 'unit1', lesson: 3, topic: 'adjectives', tags: ['basic'] },
  { id: 'v042', korean: '예쁘다', romanization: 'yeppeuda', english: 'To be pretty', category: 'adjective', unit: 'unit1', lesson: 3, topic: 'adjectives', tags: ['basic', 'irregular'] },
  { id: 'v043', korean: '덥다', romanization: 'deopda', english: 'To be hot (weather)', category: 'adjective', unit: 'unit1', lesson: 3, topic: 'adjectives', tags: ['weather', 'irregular'] },
  { id: 'v044', korean: '춥다', romanization: 'chupda', english: 'To be cold (weather)', category: 'adjective', unit: 'unit1', lesson: 3, topic: 'adjectives', tags: ['weather', 'irregular'] },
  { id: 'v045', korean: '덥다', romanization: 'deopda', english: 'To be hot', category: 'adjective', unit: 'unit1', lesson: 3, topic: 'weather', tags: ['irregular'] },

  // Lesson 5: Past, Present & Future Tense
  { id: 'v046', korean: '먹었다', romanization: 'meogeotda', english: 'Ate', category: 'verb', unit: 'unit1', lesson: 5, topic: 'verbs', tags: ['past'] },
  { id: 'v047', korean: '가고 있다', romanization: 'gago itda', english: 'Going', category: 'verb', unit: 'unit1', lesson: 5, topic: 'verbs', tags: ['progressive'] },
  { id: 'v048', korean: '먹을 것이다', romanization: 'meogeul geosida', english: 'Will eat', category: 'verb', unit: 'unit1', lesson: 5, topic: 'verbs', tags: ['future'] },

  // Lesson 6: Korean Honorifics
  { id: 'v049', korean: '존댓말', romanization: 'jondaenmal', english: 'Formal language', category: 'noun', unit: 'unit1', lesson: 6, topic: 'greetings', tags: ['honorific'] },
  { id: 'v050', korean: '반말', romanization: 'banmal', english: 'Informal language', category: 'noun', unit: 'unit1', lesson: 6, topic: 'greetings', tags: ['honorific'] },
  { id: 'v051', korean: '님', romanization: 'nim', english: 'Honorific suffix', category: 'grammar', unit: 'unit1', lesson: 6, topic: 'particles', tags: ['honorific'] },
  { id: 'v052', korean: '씨', romanization: 'ssi', english: 'Mr./Ms.', category: 'noun', unit: 'unit1', lesson: 6, topic: 'greetings', tags: ['honorific'] },

  // Lesson 7: Korean Irregulars
  { id: 'v053', korean: '듣다', romanization: 'deutda', english: 'To listen', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㄷ'] },
  { id: 'v054', korean: '읽다', romanization: 'ikda', english: 'To read', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㄹ'] },
  { id: 'v055', korean: '쓰다', romanization: 'sseuda', english: 'To write/use', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㅅ'] },
  { id: 'v056', korean: '짓다', romanization: 'jitda', english: 'To build/cook', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㅅ'] },
  { id: 'v057', korean: '굽다', romanization: 'gupda', english: 'To grill/bake', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㅂ'] },
  { id: 'v058', korean: '눕다', romanization: 'nupda', english: 'To lie down', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㅂ'] },
  { id: 'v059', korean: '줍다', romanization: 'jupda', english: 'To pick up', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㅂ'] },
  { id: 'v060', korean: '놀다', romanization: 'nolda', english: 'To play', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㄹ'] },
  { id: 'v061', korean: '살다', romanization: 'salda', english: 'To live', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㄹ'] },
  { id: 'v062', korean: '만들다', romanization: 'mandeulda', english: 'To make', category: 'verb', unit: 'unit1', lesson: 7, topic: 'verbs', tags: ['irregular', 'ㄹ'] },

  // Lesson 8: Adverbs & Negatives
  { id: 'v063', korean: '매우', romanization: 'maeu', english: 'Very', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['intensity'] },
  { id: 'v064', korean: '정말', romanization: 'jeongmal', english: 'Really', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['intensity'] },
  { id: 'v065', korean: '너무', romanization: 'neomu', english: 'Too/so', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['intensity'] },
  { id: 'v066', korean: '아주', romanization: 'aju', english: 'Very', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['intensity'] },
  { id: 'v067', korean: '잘', romanization: 'jal', english: 'Well', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['manner'] },
  { id: 'v068', korean: '못', romanization: 'mot', english: 'Cannot', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['negative'] },
  { id: 'v069', korean: '안', romanization: 'an', english: 'Not', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['negative'] },
  { id: 'v070', korean: '아직', romanization: 'ajik', english: 'Still/yet', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['time'] },
  { id: 'v071', korean: '이미', romanization: 'imi', english: 'Already', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['time'] },
  { id: 'v072', korean: '자주', romanization: 'jaju', english: 'Often', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['frequency'] },
  { id: 'v073', korean: '가끔', romanization: 'gakkeum', english: 'Sometimes', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['frequency'] },
  { id: 'v074', korean: '항상', romanization: 'hangsang', english: 'Always', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['frequency'] },
  { id: 'v075', korean: '절대', romanization: 'jeoldae', english: 'Never', category: 'adverb', unit: 'unit1', lesson: 8, topic: 'adverbs', tags: ['frequency'] },

  // Lesson 9: Conjugating 이다
  { id: 'v076', korean: '이다', romanization: 'ida', english: 'To be (noun)', category: 'grammar', unit: 'unit1', lesson: 9, topic: 'particles', tags: ['copula'] },
  { id: 'v077', korean: '아니다', romanization: 'anida', english: 'To not be', category: 'grammar', unit: 'unit1', lesson: 9, topic: 'particles', tags: ['copula', 'negative'] },

  // Lesson 10: Korean Numbers & Counters
  { id: 'v078', korean: '하나', romanization: 'hana', english: 'One', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '1'] },
  { id: 'v079', korean: '둘', romanization: 'dul', english: 'Two', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '2'] },
  { id: 'v080', korean: '셋', romanization: 'set', english: 'Three', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '3'] },
  { id: 'v081', korean: '넷', romanization: 'net', english: 'Four', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '4'] },
  { id: 'v082', korean: '다섯', romanization: 'daseot', english: 'Five', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '5'] },
  { id: 'v083', korean: '여섯', romanization: 'yeoseot', english: 'Six', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '6'] },
  { id: 'v084', korean: '일곱', romanization: 'ilgop', english: 'Seven', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '7'] },
  { id: 'v085', korean: '여덟', romanization: 'yeodeol', english: 'Eight', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '8'] },
  { id: 'v086', korean: '아홉', romanization: 'ahop', english: 'Nine', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '9'] },
  { id: 'v087', korean: '열', romanization: 'yeol', english: 'Ten', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['native', '10'] },
  { id: 'v088', korean: '일', romanization: 'il', english: 'One (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '1'] },
  { id: 'v089', korean: '이', romanization: 'i', english: 'Two (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '2'] },
  { id: 'v090', korean: '삼', romanization: 'sam', english: 'Three (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '3'] },
  { id: 'v091', korean: '사', romanization: 'sa', english: 'Four (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '4'] },
  { id: 'v092', korean: '오', romanization: 'o', english: 'Five (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '5'] },
  { id: 'v093', korean: '육', romanization: 'yuk', english: 'Six (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '6'] },
  { id: 'v094', korean: '칠', romanization: 'chil', english: 'Seven (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '7'] },
  { id: 'v095', korean: '팔', romanization: 'pal', english: 'Eight (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '8'] },
  { id: 'v096', korean: '구', romanization: 'gu', english: 'Nine (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '9'] },
  { id: 'v097', korean: '십', romanization: 'sip', english: 'Ten (Sino)', category: 'noun', unit: 'unit1', lesson: 10, topic: 'numbers', tags: ['sino', '10'] },

  // Lesson 11: Time Words
  { id: 'v098', korean: '오늘', romanization: 'oneul', english: 'Today', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v099', korean: '내일', romanization: 'naeil', english: 'Tomorrow', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v100', korean: '어제', romanization: 'eoje', english: 'Yesterday', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v101', korean: '아침', romanization: 'achim', english: 'Morning', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v102', korean: '점심', romanization: 'jeomsim', english: 'Lunch/Noon', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v103', korean: '저녁', romanization: 'jeonyeok', english: 'Evening', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v104', korean: '밤', romanization: 'bam', english: 'Night', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v105', korean: '월요일', romanization: 'woryoil', english: 'Monday', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v106', korean: '화요일', romanization: 'hwayoutil', english: 'Tuesday', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v107', korean: '수요일', romanization: 'suyoil', english: 'Wednesday', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v108', korean: '목요일', romanization: 'mogyoil', english: 'Thursday', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v109', korean: '금요일', romanization: 'geumyoutil', english: 'Friday', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v110', korean: '토요일', romanization: 'toyoil', english: 'Saturday', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v111', korean: '일요일', romanization: 'ilyoil', english: 'Sunday', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: [] },
  { id: 'v112', korean: '년', romanization: 'nyeon', english: 'Year', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: ['counter'] },
  { id: 'v113', korean: '월', romanization: 'wol', english: 'Month', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: ['counter'] },
  { id: 'v114', korean: '일', romanization: 'il', english: 'Day', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: ['counter'] },
  { id: 'v115', korean: '시', romanization: 'si', english: 'Hour', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: ['counter'] },
  { id: 'v116', korean: '분', romanization: 'bun', english: 'Minute', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: ['counter'] },
  { id: 'v117', korean: '초', romanization: 'cho', english: 'Second', category: 'noun', unit: 'unit1', lesson: 11, topic: 'time', tags: ['counter'] },

  // Lesson 12: Particles 들, 만, 에서, 부터, 까지
  { id: 'v118', korean: '들', romanization: 'deul', english: 'Plural marker', category: 'grammar', unit: 'unit1', lesson: 12, topic: 'particles', tags: ['particle'] },
  { id: 'v119', korean: '만', romanization: 'man', english: 'Only/just', category: 'grammar', unit: 'unit1', lesson: 12, topic: 'particles', tags: ['particle'] },
  { id: 'v120', korean: '에서', romanization: 'eseo', english: 'From/at (place)', category: 'grammar', unit: 'unit1', lesson: 12, topic: 'particles', tags: ['particle'] },
  { id: 'v121', korean: '부터', romanization: 'buteo', english: 'From (time)', category: 'grammar', unit: 'unit1', lesson: 12, topic: 'particles', tags: ['particle'] },
  { id: 'v122', korean: '까지', romanization: 'kkaji', english: 'Until/up to', category: 'grammar', unit: 'unit1', lesson: 12, topic: 'particles', tags: ['particle'] },

  // Lesson 13: Particles: and, with, to, from
  { id: 'v123', korean: '과', romanization: 'gwa', english: 'And/with', category: 'grammar', unit: 'unit1', lesson: 13, topic: 'particles', tags: ['particle'] },
  { id: 'v124', korean: '와', romanization: 'wa', english: 'And/with', category: 'grammar', unit: 'unit1', lesson: 13, topic: 'particles', tags: ['particle'] },
  { id: 'v125', korean: '하고', romanization: 'hago', english: 'And/with', category: 'grammar', unit: 'unit1', lesson: 13, topic: 'particles', tags: ['particle', 'informal'] },

  // Lesson 14: Korean Passive Verbs
  { id: 'v126', korean: '드리다', romanization: 'deurida', english: 'To be given (honorific)', category: 'verb', unit: 'unit1', lesson: 14, topic: 'verbs', tags: ['passive', 'honorific'] },
  { id: 'v127', korean: '받다', romanization: 'batda', english: 'To receive', category: 'verb', unit: 'unit1', lesson: 14, topic: 'verbs', tags: ['passive'] },

  // Lesson 17: ~고 & ~고 싶다
  { id: 'v128', korean: '~고 싶다', romanization: 'go sipda', english: 'Want to do', category: 'grammar', unit: 'unit1', lesson: 17, topic: 'particles', tags: ['desire'] },
  { id: 'v129', korean: '원하다', romanization: 'wonhada', english: 'To want', category: 'verb', unit: 'unit1', lesson: 17, topic: 'verbs', tags: ['desire'] },
  { id: 'v130', korean: '바라다', romanization: 'barada', english: 'To hope/wish', category: 'verb', unit: 'unit1', lesson: 17, topic: 'verbs', tags: ['desire'] },

  // Lesson 18: Present Progressive ~고 있다
  { id: 'v131', korean: '~고 있다', romanization: 'go itda', english: 'Progressive marker', category: 'grammar', unit: 'unit1', lesson: 18, topic: 'particles', tags: ['progressive'] },

  // Lesson 19: Comparatives & Superlatives
  { id: 'v132', korean: '더', romanization: 'deo', english: 'More', category: 'adverb', unit: 'unit1', lesson: 19, topic: 'adverbs', tags: ['comparison'] },
  { id: 'v133', korean: '가장', romanization: 'gajang', english: 'Most/best', category: 'adverb', unit: 'unit1', lesson: 19, topic: 'adverbs', tags: ['superlative'] },
  { id: 'v134', korean: '제일', romanization: 'jeil', english: 'Most/best', category: 'adverb', unit: 'unit1', lesson: 19, topic: 'adverbs', tags: ['superlative'] },
  { id: 'v135', korean: '덜', romanization: 'deol', english: 'Less', category: 'adverb', unit: 'unit1', lesson: 19, topic: 'adverbs', tags: ['comparison'] },

  // Lesson 21: Question Words
  { id: 'v136', korean: '왜', romanization: 'wae', english: 'Why', category: 'adverb', unit: 'unit1', lesson: 21, topic: 'adverbs', tags: ['question'] },
  { id: 'v137', korean: '언제', romanization: 'eonje', english: 'When', category: 'adverb', unit: 'unit1', lesson: 21, topic: 'adverbs', tags: ['question'] },
  { id: 'v138', korean: '어디', romanization: 'eodi', english: 'Where', category: 'adverb', unit: 'unit1', lesson: 21, topic: 'adverbs', tags: ['question'] },
  { id: 'v139', korean: '누구', romanization: 'nugu', english: 'Who', category: 'noun', unit: 'unit1', lesson: 21, topic: 'greetings', tags: ['question'] },
  { id: 'v140', korean: '무엇', romanization: 'mueot', english: 'What', category: 'noun', unit: 'unit1', lesson: 22, topic: 'greetings', tags: ['question', 'formal'] },
  { id: 'v141', korean: '뭐', romanization: 'mwo', english: 'What', category: 'noun', unit: 'unit1', lesson: 22, topic: 'greetings', tags: ['question', 'informal'] },
  { id: 'v142', korean: '어떻게', romanization: 'eotteoke', english: 'How', category: 'adverb', unit: 'unit1', lesson: 22, topic: 'adverbs', tags: ['question'] },
  { id: 'v143', korean: '몇', romanization: 'myeot', english: 'How many', category: 'noun', unit: 'unit1', lesson: 22, topic: 'numbers', tags: ['question'] },
  { id: 'v144', korean: '어느', romanization: 'eoneu', english: 'Which', category: 'noun', unit: 'unit1', lesson: 22, topic: 'greetings', tags: ['question'] },

  // Lesson 23: Colors
  { id: 'v145', korean: '빨간색', romanization: 'ppalgansaek', english: 'Red', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v146', korean: '파란색', romanization: 'paransaek', english: 'Blue', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v147', korean: '노란색', romanization: 'noransaek', english: 'Yellow', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v148', korean: '초록색', romanization: 'choroksaek', english: 'Green', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v149', korean: '검은색', romanization: 'geomeunsaek', english: 'Black', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v150', korean: '흰색', romanization: 'huinsaek', english: 'White', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v151', korean: '갈색', romanization: 'galsaek', english: 'Brown', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v152', korean: '회색', romanization: 'oesaek', english: 'Gray', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v153', korean: '보라색', romanization: 'borasaek', english: 'Purple', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v154', korean: '분홍색', romanization: 'bunhongsaek', english: 'Pink', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },
  { id: 'v155', korean: '주황색', romanization: 'juhwangsaek', english: 'Orange', category: 'noun', unit: 'unit1', lesson: 23, topic: 'colors', tags: [] },

  // ========== UNIT 2: Lower-Intermediate ==========
  // Lesson 26: ~는 것
  { id: 'v156', korean: '~는 것', romanization: 'neun geot', english: 'The act of doing', category: 'grammar', unit: 'unit2', lesson: 26, topic: 'particles', tags: ['gerund'] },
  { id: 'v157', korean: '것', romanization: 'geot', english: 'Thing', category: 'noun', unit: 'unit2', lesson: 26, topic: 'greetings', tags: [] },
  { id: 'v158', korean: '일', romanization: 'il', english: 'Work/thing', category: 'noun', unit: 'unit2', lesson: 26, topic: 'work', tags: [] },
  { id: 'v159', korean: '운동', romanization: 'undong', english: 'Exercise', category: 'noun', unit: 'unit2', lesson: 26, topic: 'sports', tags: [] },
  { id: 'v160', korean: '공부', romanization: 'gongbu', english: 'Study', category: 'noun', unit: 'unit2', lesson: 26, topic: 'school', tags: [] },

  // Lesson 27: ~던 & ~었/았던
  { id: 'v161', korean: '~던', romanization: 'deon', english: 'Past habitual', category: 'grammar', unit: 'unit2', lesson: 27, topic: 'particles', tags: ['past'] },

  // Lesson 35: ~ㄹ 것 같다
  { id: 'v162', korean: '~ㄹ 것 같다', romanization: 'l geot gatda', english: 'Seems like/will probably', category: 'grammar', unit: 'unit2', lesson: 35, topic: 'particles', tags: ['conjecture'] },

  // Lesson 40: ~아/어서 (Because)
  { id: 'v163', korean: '~아/어서', romanization: 'a eo seo', english: 'Because/so', category: 'grammar', unit: 'unit2', lesson: 40, topic: 'particles', tags: ['cause'] },

  // Lesson 41: ~기 때문에 (Because)
  { id: 'v164', korean: '~기 때문에', romanization: 'gi ttaemune', english: 'Because of', category: 'grammar', unit: 'unit2', lesson: 41, topic: 'particles', tags: ['cause'] },

  // Lesson 45: Can/Cannot: ~ㄹ 수 있다
  { id: 'v165', korean: '~ㄹ 수 있다', romanization: 'l su itda', english: 'Can/Able to', category: 'grammar', unit: 'unit2', lesson: 45, topic: 'particles', tags: ['ability'] },
  { id: 'v166', korean: '할 수 있다', romanization: 'hal su itda', english: 'Can do', category: 'phrase', unit: 'unit2', lesson: 45, topic: 'phrases', tags: ['ability'] },

  // Lesson 46: Must: ~아/어 야 하다
  { id: 'v167', korean: '~아/어 야 하다', romanization: 'a eo ya hada', english: 'Must do', category: 'grammar', unit: 'unit2', lesson: 46, topic: 'particles', tags: ['obligation'] },
  { id: 'v168', korean: '해야 한다', romanization: 'haeya handa', english: 'Must do', category: 'phrase', unit: 'unit2', lesson: 46, topic: 'phrases', tags: ['obligation'] },

  // Lesson 47: Even Though: ~지만
  { id: 'v169', korean: '~지만', romanization: 'jiman', english: 'Even though', category: 'grammar', unit: 'unit2', lesson: 47, topic: 'particles', tags: ['contrast'] },

  // Lesson 48: Regardless: ~아/어도
  { id: 'v170', korean: '~아/어도', romanization: 'a eodo', english: 'Even if', category: 'grammar', unit: 'unit2', lesson: 48, topic: 'particles', tags: ['concession'] },

  // Lesson 49: May I: ~아/어도 되다
  { id: 'v171', korean: '~아/어도 되다', romanization: 'a eodo doeda', english: 'May I/Is it okay to', category: 'grammar', unit: 'unit2', lesson: 49, topic: 'particles', tags: ['permission'] },

  // ========== UNIT 3: Intermediate Grammar ==========
  // Lesson 51: ~하기도 하고
  { id: 'v172', korean: '~하기도 하고', romanization: 'hagido hago', english: 'Sometimes do', category: 'grammar', unit: 'unit3', lesson: 51, topic: 'particles', tags: ['listing'] },

  // Lesson 52: Quoted Sentences
  { id: 'v173', korean: '~ㄴ/는다고 하다', romanization: 'n/neundago hada', english: 'Said that', category: 'grammar', unit: 'unit3', lesson: 52, topic: 'particles', tags: ['quotation'] },

  // Lesson 56: To Make/Let: ~게 하다
  { id: 'v174', korean: '~게 하다', romanization: 'ge hada', english: 'To make/let do', category: 'grammar', unit: 'unit3', lesson: 56, topic: 'particles', tags: ['causative'] },

  // Lesson 57: To Make: ~시키다
  { id: 'v175', korean: '~시키다', romanization: 'sikida', english: 'To make/order', category: 'grammar', unit: 'unit3', lesson: 57, topic: 'particles', tags: ['causative'] },

  // Lesson 58: Or: ~(이)나, ~거나
  { id: 'v176', korean: '~(이)나', romanization: '(i)na', english: 'Or', category: 'grammar', unit: 'unit3', lesson: 58, topic: 'particles', tags: ['alternative'] },
  { id: 'v177', korean: '~거나', romanization: 'geona', english: 'Or', category: 'grammar', unit: 'unit3', lesson: 58, topic: 'particles', tags: ['alternative'] },

  // Lesson 60: Like: ~처럼
  { id: 'v178', korean: '~처럼', romanization: 'cheoreom', english: 'Like/as', category: 'grammar', unit: 'unit3', lesson: 60, topic: 'particles', tags: ['comparison'] },

  // Lesson 61: The Only: 유일하다
  { id: 'v179', korean: '유일하다', romanization: 'yuilhaDA', english: 'To be the only', category: 'adjective', unit: 'unit3', lesson: 61, topic: 'adjectives', tags: [] },

  // Lesson 62: Nothing but: ~밖에
  { id: 'v180', korean: '~밖에', romanization: 'bakke', english: 'Nothing but/only', category: 'grammar', unit: 'unit3', lesson: 62, topic: 'particles', tags: ['limitation'] },

  // Lesson 63: Clause Connector: 아/어
  { id: 'v181', korean: '~아/어', romanization: 'a/eo', english: 'And then', category: 'grammar', unit: 'unit3', lesson: 63, topic: 'particles', tags: ['connection'] },

  // Lesson 64: As Much As: 만큼
  { id: 'v182', korean: '~만큼', romanization: 'mankeum', english: 'As much as', category: 'grammar', unit: 'unit3', lesson: 64, topic: 'particles', tags: ['comparison'] },

  // Lesson 65: Instead: 대신(에)
  { id: 'v183', korean: '~대신(에)', romanization: 'daesin(e)', english: 'Instead of', category: 'grammar', unit: 'unit3', lesson: 65, topic: 'particles', tags: ['substitution'] },

  // ========== UNIT 4: Upper Intermediate ==========
  // Lesson 76: According to/Due to
  { id: 'v184', korean: '~에 따르면', romanization: 'e ttareumyeon', english: 'According to', category: 'grammar', unit: 'unit4', lesson: 76, topic: 'particles', tags: ['source'] },

  // Lesson 80: As Soon As: ~자마자
  { id: 'v185', korean: '~자마자', romanization: 'jamaja', english: 'As soon as', category: 'grammar', unit: 'unit4', lesson: 80, topic: 'particles', tags: ['time'] },

  // Lesson 81: To Know How: ~ㄹ/을 줄 알다
  { id: 'v186', korean: '~ㄹ 줄 알다', romanization: 'l jul alda', english: 'Know how to', category: 'grammar', unit: 'unit4', lesson: 81, topic: 'particles', tags: ['ability'] },

  // Lesson 82: To Decide: ~기로 하다
  { id: 'v187', korean: '~기로 하다', romanization: 'giro hada', english: 'To decide to', category: 'grammar', unit: 'unit4', lesson: 82, topic: 'particles', tags: ['decision'] },

  // Lesson 85: Emphasizing: ~잖아(요)
  { id: 'v188', korean: '~잖아(요)', romanization: 'janayo', english: "You know/Isn't it", category: 'grammar', unit: 'unit4', lesson: 85, topic: 'particles', tags: ['emphasis'] },

  // Lesson 88: To End Up: ~게 되다
  { id: 'v189', korean: '~게 되다', romanization: 'ge doeda', english: 'To end up', category: 'grammar', unit: 'unit4', lesson: 88, topic: 'particles', tags: ['result'] },

  // Lesson 89: Only/Just: 뿐
  { id: 'v190', korean: '~ㄹ 뿐', romanization: 'l ppun', english: 'Only/just', category: 'grammar', unit: 'unit4', lesson: 89, topic: 'particles', tags: ['limitation'] },

  // ========== UNIT 5: Lower Advanced ==========
  // Lesson 101: Internet Slang & Abbreviations
  { id: 'v191', korean: 'ㅋㅋ', romanization: 'keke', english: 'Haha (typing)', category: 'phrase', unit: 'unit5', lesson: 101, topic: 'technology', tags: ['slang'] },
  { id: 'v192', korean: 'ㅎㅎ', romanization: 'hehe', english: 'Haha (typing)', category: 'phrase', unit: 'unit5', lesson: 101, topic: 'technology', tags: ['slang'] },
  { id: 'v193', korean: 'ㅠㅠ', romanization: 'huhu', english: 'Crying (typing)', category: 'phrase', unit: 'unit5', lesson: 101, topic: 'technology', tags: ['slang'] },
  { id: 'v194', korean: 'ㅇㅇ', romanization: 'yy', english: 'Yes (typing)', category: 'phrase', unit: 'unit5', lesson: 101, topic: 'technology', tags: ['slang'] },
  { id: 'v195', korean: 'ㄴㄴ', romanization: 'nn', english: 'No (typing)', category: 'phrase', unit: 'unit5', lesson: 101, topic: 'technology', tags: ['slang'] },
  { id: 'v196', korean: 'ㅈㅅ', romanization: 'js', english: 'Sorry (typing)', category: 'phrase', unit: 'unit5', lesson: 101, topic: 'technology', tags: ['slang'] },

  // Lesson 108: ~나 보다 (It appears)
  { id: 'v197', korean: '~나 보다', romanization: 'na boda', english: 'It seems/I guess', category: 'grammar', unit: 'unit5', lesson: 108, topic: 'particles', tags: ['conjecture'] },

  // Lesson 111: At Least: ~(이)라도
  { id: 'v198', korean: '~(이)라도', romanization: '(i)rado', english: 'At least/even', category: 'grammar', unit: 'unit5', lesson: 111, topic: 'particles', tags: ['concession'] },

  // ========== UNIT 6: Advanced Grammar ==========
  // Lesson 126: Grouped By: ~별로
  { id: 'v199', korean: '~별로', romanization: 'byeollo', english: 'Not really/not very', category: 'grammar', unit: 'unit6', lesson: 126, topic: 'particles', tags: ['negation'] },

  // Lesson 127: To Be Like: ~다운
  { id: 'v200', korean: '~다운', romanization: 'daun', english: 'Like a/typical', category: 'grammar', unit: 'unit6', lesson: 127, topic: 'particles', tags: ['description'] },

  // Lesson 128: In Other Words: ~이라고 하다
  { id: 'v201', korean: '~이라고 하다', romanization: 'irago hada', english: "That is to say", category: 'grammar', unit: 'unit6', lesson: 128, topic: 'particles', tags: ['explanation'] },

  // Lesson 131: Being In a State: ~아/어 있다
  { id: 'v202', korean: '~아/어 있다', romanization: 'a/eo itda', english: 'To be in a state', category: 'grammar', unit: 'unit6', lesson: 131, topic: 'particles', tags: ['state'] },

  // Lesson 133: How It Works: ~는法
  { id: 'v203', korean: '~는 법', romanization: 'neun beop', english: 'The way of doing', category: 'grammar', unit: 'unit6', lesson: 133, topic: 'particles', tags: ['method'] },

  // Lesson 134: In the Process Of: ~는 중
  { id: 'v204', korean: '~는 중', romanization: 'neun jung', english: 'In the process of', category: 'grammar', unit: 'unit6', lesson: 134, topic: 'particles', tags: ['progressive'] },

  // Lesson 135: To Not Know If: ~ㄹ/을지 모르다
  { id: 'v205', korean: '~ㄹ지 모르다', romanization: 'lji moreuda', english: "Don't know if", category: 'grammar', unit: 'unit6', lesson: 135, topic: 'particles', tags: ['uncertainty'] },

  // Lesson 137: Before It Gets To: ~ㄹ/을 리가 없다
  { id: 'v206', korean: '~ㄹ 리가 없다', romanization: 'l riga eopda', english: "Can't possibly", category: 'grammar', unit: 'unit6', lesson: 137, topic: 'particles', tags: ['impossibility'] },

  // Lesson 138: To Be Supposed To
  { id: 'v207', korean: '~ㄹ/을 것이다', romanization: 'l geosida', english: 'Supposed to/will', category: 'grammar', unit: 'unit6', lesson: 138, topic: 'particles', tags: ['obligation'] },

  // Lesson 142: Whatever/Whoever: ~든
  { id: 'v208', korean: '~든', romanization: 'deun', english: 'Whatever/whoever', category: 'grammar', unit: 'unit6', lesson: 142, topic: 'particles', tags: ['indefinite'] },

  // Lesson 144: I Wonder If: ~ㄹ/을까
  { id: 'v209', korean: '~ㄹ까', romanization: 'lka', english: 'I wonder if', category: 'grammar', unit: 'unit6', lesson: 144, topic: 'particles', tags: ['wonder'] },

  // Lesson 145: To Be Accustomed: ~아/어 대다
  { id: 'v210', korean: '~아/어 대다', romanization: 'a/eo daeda', english: 'To be used to', category: 'grammar', unit: 'unit6', lesson: 145, topic: 'particles', tags: ['habit'] },

  // Lesson 146: The More A, The More B
  { id: 'v211', korean: '~ㄹ수록', romanization: 'lsurok', english: 'The more...the more', category: 'grammar', unit: 'unit6', lesson: 146, topic: 'particles', tags: ['correlation'] },
]

export function searchVocabulary(query: string): VocabularyWord[] {
  const q = query.toLowerCase().trim()
  if (!q) return vocabulary

  return vocabulary.filter(w =>
    w.korean.includes(q) ||
    w.romanization.toLowerCase().includes(q) ||
    w.english.toLowerCase().includes(q) ||
    w.tags.some(t => t.includes(q))
  )
}

export function getVocabularyByTopic(topicId: string): VocabularyWord[] {
  return vocabulary.filter(w => w.topic === topicId)
}

export function getVocabularyByUnit(unitId: string): VocabularyWord[] {
  return vocabulary.filter(w => w.unit === unitId)
}

export function getVocabularyByLesson(unitId: string, lessonNum: number | string): VocabularyWord[] {
  return vocabulary.filter(w => w.unit === unitId && w.lesson === lessonNum)
}