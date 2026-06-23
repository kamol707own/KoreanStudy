'use client'

import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { XP_PER_LESSON } from '@/lib/data'
import {
  CheckCircle, Circle, Star, Shield, LayoutGrid
} from 'lucide-react'

interface LessonViewProps {
  unitId: string
  num: number | string
  title: string
  isCompleted: boolean
  totalXp: number
  level: number
  onComplete: () => void
  onBack: () => void
  onNavigate: (unitId: string, num: number | string, title: string) => void
  prevLesson: { unitId: string; num: number | string; title: string } | null
  nextLesson: { unitId: string; num: number | string; title: string } | null
}

export function LessonView({
  unitId, num, title, isCompleted, totalXp, level,
  onComplete, onBack, onNavigate, prevLesson, nextLesson
}: LessonViewProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let path: string
    if (unitId === 'themes') {
      path = `/lessons/themes/${num}.md`
    } else {
      path = `/lessons/${unitId}/lesson${num}.md`
    }

    fetch(path)
      .then(res => res.ok ? res.text() : null)
      .then(md => {
        if (md) setContent(marked.parse(md) as string)
        else setContent('<p>This lesson content is being prepared. Please check back soon.</p>')
        setLoading(false)
      })
      .catch(() => {
        setContent('<p>This lesson content is being prepared. Please check back soon.</p>')
        setLoading(false)
      })
  }, [unitId, num])

  const unitLabel = unitId === 'unit0' ? 'Unit 0: Learn to Read' :
    unitId === 'themes' ? 'Theme Lesson' :
    `Unit ${unitId.replace('unit', '')}`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">
        Loading...
        <div className="w-5 h-5 border-2 border-border border-t-korean rounded-full animate-spin ml-2.5" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-9 pb-6 border-b border-border">
        <div className="flex items-center justify-between mb-3.5">
          <Badge variant="korean" className="text-[11px] uppercase tracking-wider">
            {unitLabel}
          </Badge>
          <div className="flex items-center gap-3">
            <Badge variant="gold" className="gap-1">
              <Star className="w-3 h-3" /> {totalXp} XP
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Shield className="w-3 h-3" /> Lv.{level}
            </Badge>
            <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Dashboard
            </Button>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-2">
          Lesson {num}: {title}
        </h1>
        {isCompleted && (
          <div className="text-sm text-green flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Completed
          </div>
        )}
      </div>

      <div
        className="md-body prose prose-korean max-w-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-0
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-korean [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-border
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-9 [&_h3]:mb-4
          [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-9 [&_h4]:mb-4
          [&_p]:text-muted-foreground [&_p]:text-[15px] [&_p]:leading-[1.75] [&_p]:mb-4
          [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6
          [&_li]:text-muted-foreground [&_li]:text-[15px] [&_li]:leading-relaxed [&_li]:mb-1.5
          [&_strong]:text-foreground [&_strong]:font-semibold
          [&_em]:text-korean [&_em]:italic
          [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-sm [&_code]:text-korean [&_code]:font-mono [&_code]:border [&_code]:border-border
          [&_pre]:bg-muted [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-5
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:border-0
          [&_blockquote]:border-l-3 [&_blockquote]:border-korean [&_blockquote]:py-3.5 [&_blockquote]:px-4 [&_blockquote]:mb-5 [&_blockquote]:bg-muted/50 [&_blockquote]:rounded-r-md
          [&_blockquote_p]:mb-0
          [&_table]:w-full [&_table]:border-collapse [&_table]:mb-6 [&_table]:text-sm [&_table]:border [&_table]:border-border [&_table]:rounded-lg [&_table]:overflow-hidden
          [&_th]:bg-muted [&_th]:text-foreground [&_th]:font-semibold [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:border-b [&_th]:border-border
          [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-muted-foreground [&_td]:border-b [&_td]:border-border [&_td]:align-top
          [&_tr:last-child_td]:border-b-0 [&_tr:hover_td]:bg-muted/50
          [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border [&_hr]:my-9
          [&_a]:text-korean [&_a]:no-underline [&_a]:border-b [&_a]:border-transparent [&_a]:transition-colors hover:[&_a]:border-korean"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <div className="mt-8 pt-6 border-t border-border flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <LayoutGrid className="w-4 h-4" /> Back to Dashboard
        </Button>
        <Button
          variant={isCompleted ? "destructive" : "default"}
          onClick={onComplete}
          className="gap-2"
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4" /> Completed
              <span className="text-xs font-semibold opacity-80">-{XP_PER_LESSON} XP</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4" /> Mark as Complete
              <span className="text-xs font-semibold opacity-80">+{XP_PER_LESSON} XP</span>
            </>
          )}
        </Button>
      </div>

      <div className="mt-12 pt-6 border-t border-border flex justify-between gap-3">
        {prevLesson ? (
          <Card
            className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-korean/30 hover:bg-muted/50 transition-all"
            onClick={() => onNavigate(prevLesson.unitId, prevLesson.num, prevLesson.title)}
          >
            <CardContent className="p-3.5 flex flex-col items-start">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Previous</span>
              <span className="text-[13px] font-medium leading-snug">{prevLesson.title}</span>
            </CardContent>
          </Card>
        ) : <div className="flex-1" />}

        {nextLesson ? (
          <Card
            className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-korean/30 hover:bg-muted/50 transition-all"
            onClick={() => onNavigate(nextLesson.unitId, nextLesson.num, nextLesson.title)}
          >
            <CardContent className="p-3.5 flex flex-col items-end text-right">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Next</span>
              <span className="text-[13px] font-medium leading-snug">{nextLesson.title}</span>
            </CardContent>
          </Card>
        ) : <div className="flex-1" />}
      </div>
    </div>
  )
}