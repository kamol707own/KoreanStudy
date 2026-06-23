'use client'

import { useMemo } from 'react'
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
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="w-full">
            <div className="flex gap-[3px]">
              <div className="flex flex-col gap-[3px] mr-1">
                {dayLabels.map((label, i) => (
                  <div key={i} className="w-3 h-3 flex items-center text-[8px] text-muted-foreground">
                    {i % 2 === 0 ? label : ''}
                  </div>
                ))}
              </div>
              <div className="flex gap-[3px] overflow-hidden">
                {heatmap.weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) => (
                      <div
                        key={di}
                        className={cn(
                          "w-3 h-3 rounded-[2px] shrink-0 transition-colors",
                          day ? getIntensity(heatmap.activity[day] || 0) : "bg-transparent"
                        )}
                        title={day && heatmap.activity[day] ? `${day}: ${heatmap.activity[day]} lessons` : day || ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-[3px]">
                <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/30" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-korean/25" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-korean/45" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-korean/70" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-korean" />
              </div>
              <span>More</span>
            </div>
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
                <div className="text-xl sm:text-2xl font-bold">{streakStats.currentStreak}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">Streak</div>
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
                <div className="text-xl sm:text-2xl font-bold">{streakStats.longestStreak}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">Best</div>
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
                <div className="text-xl sm:text-2xl font-bold">{streakStats.activeDays}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">Days</div>
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
                <div className="text-xl sm:text-2xl font-bold">{avgPerDay}</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">Avg/Day</div>
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
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">Done</div>
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
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">Level</div>
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
                <div className="text-lg sm:text-xl font-bold">{overallPct}%</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}