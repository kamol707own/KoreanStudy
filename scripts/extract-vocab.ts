import fs from 'fs'
import path from 'path'

// Strict Vocabulary Extractor & Cleaner:
// 1. Ignores table headers (| Form | Example | ...), markdown structure (| Consonant | Result | ...), and sentence example tables!
// 2. Ignores numbers/pure digits (0-9) and non-words (*Conants, *Vowels, Important rules).
// 3. Extracts real vocabulary words (nouns, verbs, adjectives, adverbs, phrases, grammar terms) cleanly.
// 4. Correctly categorizes and assigns semantic topics (no structural text in Useful Phrases!).

interface WordItem {
  id: string
  korean: string
  english: string
  romanization: string
  category: string
  unit: string
  lesson: number | string
  topic: string
  tags: string[]
}

const LESSONS_DIR = path.join(process.cwd(), 'public', 'lessons')

const EXCLUDED_KOREAN = new Set([
  'Form', 'Example', 'Word', 'Type', 'Consonant', 'Vowel', 'Result', 'Combination',
  'Romanization', 'Syllable', 'Audio examples:*', 'Examples:*', 'Combined vowel syllables:*',
  'Common examples:*', 'Important rules:*', '*Conants', '*Vowels', '0', '1', '2', '3', '4',
  '5', '6', '7', '8', '9', '10', '11', '20', '21', '30', '40', '50', '59', '100', '900'
])

function isValidKoreanWord(word: string): boolean {
  if (!word) return false
  if (EXCLUDED_KOREAN.has(word)) return false
  if (word.startsWith('*') || word.startsWith('http') || word.startsWith('Lesson')) return false
  // Reject structural headers and English sentences
  if (/^[a-zA-Z\s,.:?!\/'"-]+$/.test(word)) return false
  // Reject pure numbers
  if (/^\d+$/.test(word)) return false
  return true
}

function parseMarkdownVocabulary(filePath: string, unit: string, lesson: number | string): Omit<WordItem, 'id'>[] {
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const words: Omit<WordItem, 'id'>[] = []
  
  const lines = content.split('\n')
  let currentCategory = 'noun'
  let inVocab = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('## ')) {
      const header = trimmed.replace(/^##\s*/, '').toLowerCase()
      inVocab = header.includes('vocabulary') || header.includes('consonant') || header.includes('vowel') || header.includes('alphabet')
    }

    if (trimmed.startsWith('###')) {
      const catHeader = trimmed.replace(/^###\s*/, '').toLowerCase()
      if (catHeader.includes('noun')) currentCategory = 'noun'
      else if (catHeader.includes('verb')) currentCategory = 'verb'
      else if (catHeader.includes('adjective')) currentCategory = 'adjective'
      else if (catHeader.includes('adverb')) currentCategory = 'adverb'
      else if (catHeader.includes('phrase') || catHeader.includes('expression') || catHeader.includes('greeting')) currentCategory = 'phrase'
      else if (catHeader.includes('particle') || catHeader.includes('grammar') || catHeader.includes('consonant') || catHeader.includes('vowel')) currentCategory = 'grammar'
    }

    // 1. Parse Table Rows (| Korean | English | ...) ONLY inside vocabulary sections or Unit 0
    if (trimmed.startsWith('|') && !trimmed.includes('---')) {
      const parts = trimmed.split('|').map(p => p.trim()).filter(Boolean)
      const firstCol = parts[0]?.replace(/\*\*/g, '').trim()
      const secondCol = parts[1]?.replace(/\*\*/g, '').trim()
      const thirdCol = parts[2] ? parts[2].replace(/\*\*/g, '').trim() : ''

      if (!isValidKoreanWord(firstCol)) continue

      if (parts.length >= 2 && firstCol && secondCol) {
        const isUnit0 = unit === 'unit0'
        const korean = firstCol
        let english = isUnit0 ? (thirdCol || `Letter (${secondCol})`) : secondCol
        let romanization = isUnit0 ? secondCol : ''

        // Ignore conjugated example sentences in grammar tables!
        if (korean.includes(' ') && (korean.endsWith('다') || korean.endsWith('야') || korean.endsWith('예요') || korean.endsWith('어요'))) {
          // If it's a conjugated example sentence table, ignore
          if (!inVocab && !isUnit0) continue
        }

        words.push({
          korean,
          english,
          romanization,
          category: isUnit0 ? 'grammar' : currentCategory,
          unit,
          lesson,
          topic: inferTopic(korean, english, currentCategory, unit),
          tags: [isUnit0 ? 'hangul' : currentCategory]
        })
      }
      continue
    }

    // 2. Parse Bullet Lists (- **word** = english) ONLY inside vocabulary sections or Unit 0
    if (inVocab || unit === 'unit0') {
      const listMatch = trimmed.match(/^[-*]\s*(?:\*\*(.*?)\*\*|\*(.*?)\*|([^\s:=]+))\s*(?:[=:-]\s*(.*))?$/)
      if (listMatch) {
        const rawKorean = (listMatch[1] || listMatch[2] || listMatch[3] || '').trim()
        let rawEnglish = (listMatch[4] || '').trim().replace(/\*\*/g, '').replace(/\*/g, '')

        if (!isValidKoreanWord(rawKorean)) continue

        // Lookahead for multi-line entry (Unit 8 format)
        if (!rawEnglish && i + 1 < lines.length) {
          for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
            const nextLine = lines[j].trim()
            if (nextLine.startsWith('- **') || nextLine.startsWith('###') || nextLine.startsWith('##') || nextLine.startsWith('|')) break
            if (nextLine.startsWith('=') || nextLine.startsWith('- =')) {
              rawEnglish = nextLine.replace(/^[-*=\s]+/, '').trim()
              break
            }
          }
        }

        const isUnit0 = unit === 'unit0'
        const cat = isUnit0 ? 'grammar' : currentCategory

        words.push({
          korean: rawKorean,
          english: rawEnglish || 'Vocabulary entry',
          romanization: '',
          category: cat,
          unit,
          lesson,
          topic: inferTopic(rawKorean, rawEnglish, cat, unit),
          tags: [cat]
        })
      }
    }
  }

  return words
}

function inferTopic(korean: string, english: string, category: string, unit: string): string {
  if (unit === 'unit0' || category === 'alphabet' || (korean.length === 1 && !/[\uac00-\ud7af]/.test(korean))) {
    return 'alphabet'
  }

  const eng = english.toLowerCase()

  // Standard semantic topic matching
  if (eng.includes('hello') || eng.includes('thank') || eng.includes('sorry') || eng.includes('goodbye') || eng.includes('welcome')) return 'greetings'
  if (eng.includes('food') || eng.includes('eat') || eng.includes('drink') || eng.includes('soup') || eng.includes('tea') || eng.includes('meat') || eng.includes('rice') || eng.includes('cook')) return 'food'
  if (eng.includes('time') || eng.includes('day') || eng.includes('year') || eng.includes('hour') || eng.includes('night') || eng.includes('morning') || eng.includes('month') || eng.includes('week')) return 'time'
  if (eng.includes('school') || eng.includes('student') || eng.includes('teacher') || eng.includes('exam') || eng.includes('class') || eng.includes('study')) return 'school'
  if (eng.includes('rain') || eng.includes('sun') || eng.includes('weather') || eng.includes('wind') || eng.includes('sky') || eng.includes('snow') || eng.includes('cloud')) return 'weather'
  if (eng.includes('car') || eng.includes('bus') || eng.includes('train') || eng.includes('road') || eng.includes('station') || eng.includes('subway') || eng.includes('drive')) return 'transport'
  if (eng.includes('money') || eng.includes('buy') || eng.includes('price') || eng.includes('pay') || eng.includes('shop') || eng.includes('store') || eng.includes('cost')) return 'shopping'
  if (eng.includes('family') || eng.includes('mother') || eng.includes('father') || eng.includes('friend') || eng.includes('person') || eng.includes('child') || eng.includes('parent')) return 'family'
  if (eng.includes('work') || eng.includes('job') || eng.includes('office') || eng.includes('company') || eng.includes('boss') || eng.includes('employee')) return 'work'
  if (eng.includes('hand') || eng.includes('foot') || eng.includes('eye') || eng.includes('head') || eng.includes('body') || eng.includes('face') || eng.includes('leg')) return 'body'

  if (category === 'verb') return 'verbs'
  if (category === 'adjective') return 'adjectives'
  if (category === 'adverb') return 'adverbs'
  if (category === 'grammar') return 'particles'
  
  if (category === 'phrase' || (korean.includes(' ') && !korean.endsWith('다'))) {
    return 'phrases'
  }

  return 'home'
}

const extractedWords: Omit<WordItem, 'id'>[] = []

// Unit 0
for (let l = 1; l <= 3; l++) {
  extractedWords.push(...parseMarkdownVocabulary(path.join(LESSONS_DIR, 'unit0', `lesson${l}.md`), 'unit0', l))
}

// Unit 1 to 8 (1 to 200)
for (let u = 1; u <= 8; u++) {
  const unitId = `unit${u}`
  const startLesson = (u - 1) * 25 + 1
  const endLesson = u * 25
  for (let l = startLesson; l <= endLesson; l++) {
    extractedWords.push(...parseMarkdownVocabulary(path.join(LESSONS_DIR, unitId, `lesson${l}.md`), unitId, l))
  }
}

// Themes
const themes = ['eating', 'school', 'shopping', 'transportation', 'weather']
for (const theme of themes) {
  extractedWords.push(...parseMarkdownVocabulary(path.join(LESSONS_DIR, 'themes', `${theme}.md`), 'themes', theme))
}

// Deduplicate
const seen = new Set<string>()
const uniqueWords: WordItem[] = []

extractedWords.forEach((w, index) => {
  const key = `${w.korean}_${w.unit}_${w.lesson}`
  if (!seen.has(key)) {
    seen.add(key)
    uniqueWords.push({
      id: `vw_${index + 1}`,
      ...w
    })
  }
})

console.log(`Cleaned & Extracted total ${uniqueWords.length} real vocabulary words!`)

// Output clean JSON dataset
fs.writeFileSync(path.join(process.cwd(), 'public', 'vocabulary-data.json'), JSON.stringify(uniqueWords))
