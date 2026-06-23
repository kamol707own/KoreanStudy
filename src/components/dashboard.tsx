'use client'

import { Card, CardContent } from '@/components/ui/card'
import { units, themes, XP_PER_LEVEL } from '@/lib/data'
import { StatsPanel } from '@/components/stats-panel'
import {
  Flame, CheckCircle, BookOpen, Star, Shield, Play, BarChart3, LayoutGrid
} from 'lucide-react'

interface DashboardProps {
  streak: number
  totalXp: number
  level: number
  xpInLevel: number
  completedCount: number
  overallPct: number
  getUnitCompletedCount: (unitId: string) => number
  getNextLesson: () => { unitId: string; num: number | string; title: string; unitName: string } | null
  onSelectLesson: (unitId: string, num: number | string, title: string) => void
  onSelectTheme: (themeId: string, title: string) => void
  getHeatmapData: () => { weeks: string[][]; dayLabels: string[]; activity: Record<string, number> }
  getStreakStats: () => { currentStreak: number; longestStreak: number; activeDays: number }
}

export function Dashboard({
  streak, totalXp, level, xpInLevel, completedCount, overallPct,
  getUnitCompletedCount, getNextLesson, onSelectLesson, onSelectTheme,
  getHeatmapData, getStreakStats
}: DashboardProps) {
  const next = getNextLesson()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[800px] mx-auto">
      <div className="text-center py-8 px-5">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
          <span className="text-korean">Korean</span> Study
        </h1>
        <p className="text-muted-foreground text-[15px] max-w-[460px] mx-auto leading-relaxed">
          A minimalistic guide to learning Korean, based on How to Study Korean.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-4">
            <div className="w-[34px] h-[34px] rounded-lg bg-korean/15 flex items-center justify-center mb-2.5">
              <Flame className="w-[15px] h-[15px] text-korean" />
            </div>
            <div className="text-2xl font-bold leading-none mb-1">{streak}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Day Streak</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-4">
            <div className="w-[34px] h-[34px] rounded-lg bg-green/15 flex items-center justify-center mb-2.5">
              <CheckCircle className="w-[15px] h-[15px] text-green" />
            </div>
            <div className="text-2xl font-bold leading-none mb-1">{completedCount}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Completed</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-4">
            <div className="w-[34px] h-[34px] rounded-lg bg-blue/15 flex items-center justify-center mb-2.5">
              <BookOpen className="w-[15px] h-[15px] text-blue" />
            </div>
            <div className="text-2xl font-bold leading-none mb-1">{overallPct}%</div>
            <div className="text-[11px] text-muted-foreground font-medium">Overall</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-4">
            <div className="w-[34px] h-[34px] rounded-lg bg-gold/15 flex items-center justify-center mb-2.5">
              <Star className="w-[15px] h-[15px] text-gold" />
            </div>
            <div className="text-2xl font-bold leading-none mb-1">{totalXp}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Total XP</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-korean" />
              Level {level}
            </div>
            <div className="text-xs text-muted-foreground">{xpInLevel} / {XP_PER_LEVEL} XP</div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-korean-dim to-korean rounded-full transition-all duration-500"
              style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {next && (
        <Card
          className="mb-6 border-border/50 bg-gradient-to-br from-korean/10 to-card/50 backdrop-blur-sm cursor-pointer hover:border-korean/30 hover:-translate-y-0.5 transition-all"
          onClick={() => {
            if (next.unitId === 'themes') onSelectTheme(next.num as string, next.title)
            else onSelectLesson(next.unitId, next.num, next.title)
          }}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-[42px] h-[42px] rounded-[10px] bg-korean/15 flex items-center justify-center shrink-0">
                <Play className="w-[18px] h-[18px] text-korean" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Continue learning</div>
                <div className="text-sm font-semibold truncate">{next.unitName} - Lesson {next.num}: {next.title}</div>
              </div>
            </div>
            <div className="text-[13px] font-semibold text-korean flex items-center gap-1.5 shrink-0 ml-4">
              Start <Play className="w-3 h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <h3 className="text-[15px] font-semibold mb-3.5 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-korean" /> Statistics
        </h3>
        <StatsPanel
          level={level}
          completedCount={completedCount}
          overallPct={overallPct}
          getHeatmapData={getHeatmapData}
          getStreakStats={getStreakStats}
        />
      </div>

      <div className="mb-6">
        <h3 className="text-[15px] font-semibold mb-3.5 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-korean" /> Unit Progress
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {units.map(u => {
            const done = getUnitCompletedCount(u.id)
            const total = u.lessons.length
            const pct = total > 0 ? Math.round(done / total * 100) : 0
            const firstLesson = u.lessons[0]

            return (
              <Card
                key={u.id}
                className="border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-korean/30 hover:-translate-y-0.5 transition-all"
                onClick={() => onSelectLesson(u.id, firstLesson.id, firstLesson.title)}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">{u.name}</span>
                    <span className="text-xs font-semibold text-korean">{pct}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-korean rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground">{done}/{total} lessons</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[15px] font-semibold mb-3.5 flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-korean" /> All Units
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {units.map(u => {
            const firstLesson = u.lessons[0]
            return (
              <Card
                key={u.id}
                className="border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-korean/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-korean/5 transition-all relative overflow-hidden group"
                onClick={() => onSelectLesson(u.id, firstLesson.id, firstLesson.title)}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-korean to-creamy opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-korean mb-2">{u.name}</div>
                  <div className="text-sm font-medium mb-1 leading-snug">{u.title}</div>
                  <div className="text-xs text-muted-foreground">{u.lessons.length} lessons</div>
                </CardContent>
              </Card>
            )
          })}
          <Card
            className="border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-korean/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-korean/5 transition-all relative overflow-hidden group"
            onClick={() => onSelectTheme('school', 'School')}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-korean to-creamy opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-korean mb-2">Themes</div>
              <div className="text-sm font-medium mb-1 leading-snug">Theme Lessons</div>
              <div className="text-xs text-muted-foreground">{themes.length} themed lessons</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}