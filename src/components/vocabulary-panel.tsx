'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { vocabulary, topics, searchVocabulary, getVocabularyByTopic } from '@/lib/vocabulary'
import type { VocabularyWord } from '@/lib/vocabulary'
import { units, getLessonTitle } from '@/lib/data'
import {
  Search, BookOpen, ChevronRight, Filter
} from 'lucide-react'

function VocabularyCard({ word }: { word: VocabularyWord }) {
  const categoryColors: Record<string, string> = {
    noun: 'bg-blue/15 text-blue',
    verb: 'bg-green/15 text-green',
    adjective: 'bg-gold/15 text-gold',
    adverb: 'bg-korean/15 text-korean',
    phrase: 'bg-purple-500/15 text-purple-400',
    grammar: 'bg-red/15 text-red',
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-korean/30 transition-all">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-semibold text-base text-foreground">{word.korean}</div>
          <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", categoryColors[word.category])}>
            {word.category}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mb-1">{word.romanization}</div>
        <div className="text-sm font-medium">{word.english}</div>
        {word.tags.length > 0 && (
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

function TopicGroup({ topicId, topicName }: { topicId: string; topicName: string }) {
  const words = useMemo(() => getVocabularyByTopic(topicId), [topicId])
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
            <VocabularyCard key={word.id} word={word} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function LessonGroup({ unitId, unitName, lessonNum, lessonTitle }: {
  unitId: string; unitName: string; lessonNum: number | string; lessonTitle: string
}) {
  const words = useMemo(() =>
    vocabulary.filter(w => w.unit === unitId && w.lesson === lessonNum),
    [unitId, lessonNum]
  )
  const [isOpen, setIsOpen] = useState(false)

  if (words.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-9 px-3 text-xs">
          <span className="flex items-center gap-2 truncate">
            <span className="text-muted-foreground">{unitName}</span>
            <span className="truncate">Lesson {lessonNum}: {lessonTitle}</span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">{words.length}</Badge>
          </span>
          <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", isOpen && "rotate-90")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {words.map(word => (
            <VocabularyCard key={word.id} word={word} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function UnitLessonGroup({ unit }: { unit: typeof units[0] }) {
  const words = useMemo(() =>
    vocabulary.filter(w => w.unit === unit.id),
    [unit.id]
  )
  const [isOpen, setIsOpen] = useState(false)

  if (words.length === 0) return null

  const lessonsWithWords = unit.lessons.filter(l =>
    vocabulary.some(w => w.unit === unit.id && w.lesson === l.id)
  )

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-10 px-3">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-korean" />
            {unit.name}: {unit.title}
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
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function VocabularyPanel() {
  const [search, setSearch] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')

  const filteredWords = useMemo(() => {
    let words = search ? searchVocabulary(search) : vocabulary

    if (selectedTopic !== 'all') {
      words = words.filter(w => w.topic === selectedTopic)
    }

    if (selectedUnit !== 'all') {
      words = words.filter(w => w.unit === selectedUnit)
    }

    return words
  }, [search, selectedTopic, selectedUnit])

  const topicsWithWords = useMemo(() => {
    return topics.filter(t => vocabulary.some(w => w.topic === t.id))
  }, [])

  const unitsWithWords = useMemo(() => {
    return units.filter(u => vocabulary.some(w => w.unit === u.id))
  }, [])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          <span className="text-korean">Vocabulary</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {vocabulary.length} Korean words and phrases
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Korean, romanization, or English..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topicsWithWords.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <BookOpen className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {units.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Badge variant="secondary" className="mb-4">
        {filteredWords.length} words found
      </Badge>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="lessons">By Lesson</TabsTrigger>
          <TabsTrigger value="topics">By Topic</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          {search || selectedUnit !== 'all' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredWords.map(word => (
                <VocabularyCard key={word.id} word={word} />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {unitsWithWords.map(unit => (
                <UnitLessonGroup key={unit.id} unit={unit} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="topics">
          {search || selectedTopic !== 'all' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredWords.map(word => (
                <VocabularyCard key={word.id} word={word} />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {topicsWithWords.map(topic => (
                <TopicGroup key={topic.id} topicId={topic.id} topicName={topic.name} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}