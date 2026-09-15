'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Flame, Trophy, Calendar, Target, Zap, TrendingUp, Clock, Award
} from 'lucide-react'

interface StatsPanelProps {
  level: number
  completedCount: number
  overallPct: number
  getHeatmapData: () => { weeks: string[][]; dayLabels: string[]; activity: Record<string, number> }
  getStreakStats: () => { currentStreak: number; longestStreak: number; activeDays: number }
}

export function StatsPanel({
  level, completedCount, overallPct,
  getHeatmapData, getStreakStats
}: StatsPanelProps) {
  const t = useTranslations('stats')
  const heatmap = useMemo(() => getHeatmapData(), [getHeatmapData])
  const streakStats = useMemo(() => getStreakStats(), [getStreakStats])

  const maxActivity = useMemo(() => {
    const values = Object.values(heatmap.activity)
    return values.length > 0 ? Math.max(...values) : 1
  }, [heatmap.activity])

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted/30'
    const ratio = count / maxActivity
    if (ratio <= 0.25) return 'bg-korean/25'
    if (ratio <= 0.5) return 'bg-korean/45'
    if (ratio <= 0.75) return 'bg-korean/70'
    return 'bg-korean'
  }

  const totalActiveLessons = useMemo(() => {
    const values = Object.values(heatmap.activity)
    return values.reduce((sum, v) => sum + v, 0)
  }, [heatmap.activity])

  const avgPerDay = streakStats.activeDays > 0
    ? (totalActiveLessons / streakStats.activeDays).toFixed(1)
    : '0'

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-korean" />
            {t('activity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: `12px repeat(${heatmap.weeks.length}, minmax(0, 1fr))`,
              gap: '2px',
            }}
          >
            <div className="flex flex-col" style={{ gap: '2px' }}>
              {dayLabels.map((label, i) => (
                <div key={i} className="aspect-square flex items-center text-[9px] leading-none text-muted-foreground/70">
                  {i % 2 === 0 ? label : ''}
                </div>
              ))}
            </div>
            {heatmap.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: '2px' }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={cn(
                      "aspect-square w-full rounded-[2px]",
                      day ? getIntensity(heatmap.activity[day] || 0) : "bg-transparent"
                    )}
                    title={day && heatmap.activity[day] ? `${day}: ${heatmap.activity[day]}` : day || ''}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground/70">
            <span>{t('less')}</span>
            <div className="flex gap-[2px]">
              <div className="w-[9px] h-[9px] rounded-[2px] bg-muted/30" />
              <div className="w-[9px] h-[9px] rounded-[2px] bg-korean/25" />
              <div className="w-[9px] h-[9px] rounded-[2px] bg-korean/45" />
              <div className="w-[9px] h-[9px] rounded-[2px] bg-korean/70" />
              <div className="w-[9px] h-[9px] rounded-[2px] bg-korean" />
            </div>
            <span>{t('more')}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-korean/15 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-korean" />
              </div>
              <div>
                <div key={streakStats.currentStreak} className="text-xl sm:text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">{streakStats.currentStreak}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t('streak')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-gold" />
              </div>
              <div>
                <div key={streakStats.longestStreak} className="text-xl sm:text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">{streakStats.longestStreak}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t('best')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-green/15 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-green" />
              </div>
              <div>
                <div key={streakStats.activeDays} className="text-xl sm:text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">{streakStats.activeDays}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t('days')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue/15 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-blue" />
              </div>
              <div>
                <div key={avgPerDay} className="text-xl sm:text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">{avgPerDay}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t('avgPerDay')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-korean/15 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-korean" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold">{completedCount}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t('done')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-gold" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold">Lv.{level}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t('level')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-green/15 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-green" />
              </div>
              <div>
                <div className={cn("text-lg sm:text-xl font-bold", overallPct >= 100 && "text-green")}>{overallPct}%</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t('progress')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}