export interface VocabularyWord {
  id: string
  korean: string
  romanization: string
  english: string
  category: string
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
  { id: 'alphabet', name: 'Korean Alphabet & Characters', icon: 'BookOpen' },
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

export const vocabulary: VocabularyWord[] = []

export function wordsForLesson(
  words: VocabularyWord[],
  unitId: string,
  lessonNum: number | string
): VocabularyWord[] {
  return words.filter(w => w.unit === unitId && String(w.lesson) === String(lessonNum))
}