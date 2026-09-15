'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SrsStatCards, SrsVisuals } from '@/components/srs-visuals'
import { getCardStats, type SrsCard } from '@/lib/srs'
import { Brain, Play, Plus, CircleCheck } from 'lucide-react'

interface VocabularyStudyProps {
  dueToday: number
  srsCards: Record<string, SrsCard>
  onStartReview: () => void
  onAddWords: () => void
}

/**
 * The vocabulary study section (sidebar "Learn Vocabulary"). This is the home
 * of everything about the spaced-repetition deck: how many words are due, the
 * deck health visuals, and one obvious "Start review" action. The dashboard
 * intentionally stays free of these details and links here instead.
 */
export function VocabularyStudy({
  dueToday, srsCards, onStartReview, onAddWords,
}: VocabularyStudyProps) {
  const t = useTranslations('srs')
  const tNav = useTranslations('nav')
  const tDash = useTranslations('dash')
  const stats = useMemo(() => getCardStats(srsCards), [srsCards])
  const hasDeck = stats.total > 0

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-korean/15 flex items-center justify-center">
          <Brain className="w-[18px] h-[18px] text-korean" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">{tNav('learnVocab')}</h1>
          <p className="text-xs text-muted-foreground">{t('sectionSub')}</p>
        </div>
      </div>

      {/* Hero / primary action */}
      {dueToday > 0 ? (
        <Card className="mb-6 overflow-hidden border-border/40 bg-gradient-to-br from-green/15 via-korean/10 to-card/50 backdrop-blur-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-green to-green/70 flex flex-col items-center justify-center shadow-lg shadow-green/20">
                  <span className="text-2xl font-extrabold text-background leading-none">{dueToday}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-background/80 mt-0.5">{t('due')}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-lg leading-tight">{t('readyToReview')}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t('focusHint')}</p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={onStartReview}
                className="w-full sm:w-auto gap-2 bg-gradient-to-r from-green to-green/80 hover:from-green/90 hover:to-green/70 text-green-950 font-bold"
              >
                <Play className="w-4 h-4" /> {t('startReview')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 overflow-hidden border-border/40 bg-gradient-to-br from-green/10 to-card/50 backdrop-blur-sm">
          <CardContent className="p-5 sm:p-6">
            {hasDeck ? (
              <div className="flex flex-col items-center text-center gap-1.5 py-2">
                <div className="w-12 h-12 rounded-full bg-green/15 flex items-center justify-center mb-1">
                  <CircleCheck className="w-6 h-6 text-green" />
                </div>
                <div className="font-bold text-lg">{tDash('allCaughtUp')}</div>
                <p className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">{t('allCaughtUpBody')}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-1.5 py-2">
                <div className="w-12 h-12 rounded-full bg-korean/15 flex items-center justify-center mb-1">
                  <Brain className="w-6 h-6 text-korean" />
                </div>
                <div className="font-bold text-lg">{t('emptyDeck')}</div>
                <p className="text-xs text-muted-foreground max-w-[320px] leading-relaxed">{tDash('noWordsYet')}</p>
              </div>
            )}
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={onAddWords} className="gap-2">
                <Plus className="w-4 h-4" /> {t('addMoreWords')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasDeck && (
        <>
          <SrsStatCards stats={stats} />
          <SrsVisuals cards={srsCards} />
        </>
      )}
    </div>
  )
}