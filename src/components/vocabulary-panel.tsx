'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAppLocale } from '@/i18n/use-app-locale'
import { localizedLessonTitle, localizedTopicName, localizedUnitTitle, localizedVocabMeaning } from '@/lib/i18n/content'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { topics } from '@/lib/vocabulary'
import type { VocabularyWord } from '@/lib/vocabulary'
import { units } from '@/lib/data'
import { useSrs } from '@/hooks/use-srs'
import { SearchBox } from '@/components/search-box'
import { getSiteIndex, loadVocabularyData, loadZhDict } from '@/lib/site-search'
import {
  BookOpen, ChevronRight, Filter, Plus, Layers
} from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  noun: 'bg-blue/15 text-blue',
  verb: 'bg-green/15 text-green',
  adjective: 'bg-gold/15 text-gold',
  adverb: 'bg-korean/15 text-korean',
  phrase: 'bg-purple-500/15 text-purple-400',
  grammar: 'bg-red/15 text-red',
}

/** Categories that have a translation in the `category` namespace. */
const TRANSLATED_CATEGORIES = [
  'noun', 'verb', 'adjective', 'adverb', 'phrase', 'grammar',
] as const

type TranslatedCategory = (typeof TRANSLATED_CATEGORIES)[number]

function isTranslatedCategory(value: string): value is TranslatedCategory {
  return (TRANSLATED_CATEGORIES as readonly string[]).includes(value)
}

function VocabularyCard({ word, zhDict }: { word: VocabularyWord; zhDict?: Record<string, string> }) {
  const locale = useAppLocale()
  const tCat = useTranslations('category')
  const tSrs = useTranslations('srs')
  const srs = useSrs()
  const inReview = !!srs.getCard(word.id)

  const toggleReview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (inReview) srs.removeWords([word.id])
    else srs.addWords([word.id])
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-korean/30 transition-all">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-semibold text-base text-foreground">{word.korean}</div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              title={inReview ? tSrs('inReview') : tSrs('addToReview')}
              aria-label={inReview ? tSrs('inReview') : tSrs('addToReview')}
              onClick={toggleReview}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md border transition-colors',
                inReview
                  ? 'border-green/30 bg-green/15 text-green'
                  : 'border-border/60 bg-card/60 text-muted-foreground hover:border-korean/40 hover:text-korean'
              )}
            >
              {inReview ? <Layers className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
            <Badge className={cn("text-[10px] px-1.5 py-0 capitalize", CATEGORY_COLORS[word.category] || 'bg-muted text-muted-foreground')}>
              {isTranslatedCategory(word.category) ? tCat(word.category) : word.category}
            </Badge>
          </div>
        </div>
        {word.romanization && <div className="text-xs text-muted-foreground mb-1">{word.romanization}</div>}
        <div className="text-sm font-medium">{localizedVocabMeaning(locale, word, zhDict)}</div>
        {word.tags && word.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {word.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TopicGroup({ topicId, topicName, vocabulary, zhDict }: { topicId: string; topicName: string; vocabulary: VocabularyWord[]; zhDict?: Record<string, string> }) {
  const words = useMemo(() => vocabulary.filter(w => w.topic === topicId), [vocabulary, topicId])
  const [isOpen, setIsOpen] = useState(false)

  if (words.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-10 px-3">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-korean" />
            {topicName}
            <Badge variant="secondary" className="text-[10px]">{words.length}</Badge>
          </span>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {words.map(word => (
            <VocabularyCard key={word.id} word={word} zhDict={zhDict} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function LessonGroup({ unitId, unitName, lessonNum, lessonTitle, vocabulary, zhDict }: {
  unitId: string; unitName: string; lessonNum: number | string; lessonTitle: string; vocabulary: VocabularyWord[]; zhDict?: Record<string, string>
}) {
  const locale = useAppLocale()
  const tCommon = useTranslations('common')
  const words = useMemo(() =>
    vocabulary.filter(w => w.unit === unitId && String(w.lesson) === String(lessonNum)),
    [vocabulary, unitId, lessonNum]
  )
  const [isOpen, setIsOpen] = useState(false)

  if (words.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-9 px-3 text-xs">
          <span className="flex items-center gap-2 truncate">
            <span className="text-muted-foreground">{unitName}</span>
            <span className="truncate">{tCommon('lessonNum', { num: lessonNum, title: localizedLessonTitle(locale, unitId, lessonNum, lessonTitle) })}</span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">{words.length}</Badge>
          </span>
          <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", isOpen && "rotate-90")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {words.map(word => (
            <VocabularyCard key={word.id} word={word} zhDict={zhDict} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function UnitLessonGroup({ unit, vocabulary, zhDict }: { unit: typeof units[0]; vocabulary: VocabularyWord[]; zhDict?: Record<string, string> }) {
  const locale = useAppLocale()
  const words = useMemo(() =>
    vocabulary.filter(w => w.unit === unit.id),
    [vocabulary, unit.id]
  )
  const [isOpen, setIsOpen] = useState(false)

  if (words.length === 0) return null

  const lessonsWithWords = unit.lessons.filter(l =>
    vocabulary.some(w => w.unit === unit.id && String(w.lesson) === String(l.id))
  )

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-10 px-3">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-korean" />
            {unit.name}: {localizedUnitTitle(locale, unit.id, unit.title)}
            <Badge variant="secondary" className="text-[10px]">{words.length}</Badge>
          </span>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-2">
        {lessonsWithWords.map(lesson => (
          <LessonGroup
            key={lesson.id}
            unitId={unit.id}
            unitName={unit.name}
            lessonNum={lesson.id}
            lessonTitle={lesson.title}
            vocabulary={vocabulary}
            zhDict={zhDict}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function VocabularyPanel({
  onSelectLesson,
  onSelectTheme,
}: {
  onSelectLesson?: (unitId: string, num: number | string, title: string) => void
  onSelectTheme?: (themeId: string, title: string) => void
}) {
  const locale = useAppLocale()
  const t = useTranslations('vocab')
  const tCommon = useTranslations('common')
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([])
  const [zhDict, setZhDict] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')

  const index = useMemo(
    () => getSiteIndex({ locale, vocabulary, zhDict, withWords: true }),
    [vocabulary, zhDict, locale]
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([loadVocabularyData(), loadZhDict(locale)])
      .then(([vocabData, dictData]) => {
        if (cancelled) return
        setVocabulary(vocabData)
        setZhDict(dictData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      cancelled = true
    }
  }, [locale])

  const filteredWords = useMemo(() => {
    const hay = search.trim().toLowerCase()
    if (!hay) return vocabulary

    // The search engine already expands categories: "color" -> every color
    // word, "weathre" -> weather words despite the typo.
    const matchingIds = new Set(
      index.matchAll(search.trim(), ['word']).map((h) => h.doc.id)
    )
    return vocabulary.filter((w) => {
      if (!matchingIds.has(w.id)) return false
      if (selectedTopic !== 'all' && w.topic !== selectedTopic) return false
      if (selectedUnit !== 'all' && w.unit !== selectedUnit) return false
      return true
    })
  }, [index, vocabulary, search, selectedTopic, selectedUnit])

  const topicsWithWords = useMemo(() => {
    return topics.filter(t => vocabulary.some(w => w.topic === t.id))
  }, [vocabulary])

  const unitsWithWords = useMemo(() => {
    return units.filter(u => vocabulary.some(w => w.unit === u.id))
  }, [vocabulary])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">
        {tCommon('loading')}
        <div className="w-5 h-5 border-2 border-border border-t-korean rounded-full animate-spin ml-2.5" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          <span className="text-korean">{t('title')}</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('count', { count: vocabulary.length })}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <SearchBox
            index={index}
            value={search}
            onChange={setSearch}
            placeholder={t('searchPlaceholder')}
            ariaLabel={t('searchPlaceholder')}
            variant="panel"
            onSelectWord={(doc) => {
              const w = doc.payload?.word as VocabularyWord | undefined
              if (!w) return
              // Home in on the picked word: pin topic + unit so its group
              // stays visible, and narrow the grid to it.
              setSearch(w.korean)
              setSelectedTopic(w.topic)
              setSelectedUnit(String(w.unit))
            }}
            onSelectLesson={(doc) => {
              const p = doc.payload as
                | { unitId: string; num: number | string; title: string }
                | undefined
              if (p) onSelectLesson?.(p.unitId, p.num, p.title)
            }}
            onSelectTheme={(doc) => {
              const p = doc.payload as { themeId: string; title: string } | undefined
              if (p) onSelectTheme?.(p.themeId, p.title)
            }}
            onSelectCategory={(category) => {
              // "Show all colors": the category's trigger word IS the filter —
              // the engine matches every member via its concept field.
              setSearch(category.matchedAlias ?? category.label)
            }}
          />
        </div>
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t('topic')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTopics')}</SelectItem>
            {topicsWithWords.map(topic => (
              <SelectItem key={topic.id} value={topic.id}>{localizedTopicName(locale, topic.id, topic.name)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <BookOpen className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t('unit')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allUnits')}</SelectItem>
            {units.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Badge variant="secondary" className="mb-4">
        {t('wordsFound', { count: filteredWords.length })}
      </Badge>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="lessons">{t('byLesson')}</TabsTrigger>
          <TabsTrigger value="topics">{t('byTopic')}</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          {search || selectedUnit !== 'all' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredWords.map(word => (
                <VocabularyCard key={word.id} word={word} zhDict={zhDict} />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {unitsWithWords.map(unit => (
                <UnitLessonGroup key={unit.id} unit={unit} vocabulary={vocabulary} zhDict={zhDict} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="topics">
          {search || selectedTopic !== 'all' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredWords.map(word => (
                <VocabularyCard key={word.id} word={word} zhDict={zhDict} />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {topicsWithWords.map(topic => (
                <TopicGroup key={topic.id} topicId={topic.id} topicName={localizedTopicName(locale, topic.id, topic.name)} vocabulary={vocabulary} zhDict={zhDict} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}