'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAppLocale } from '@/i18n/use-app-locale'
import { Card, CardContent } from '@/components/ui/card'
import { cn, activatable } from '@/lib/utils'
import {
  getCardStats, getForecast, type SrsCard, type SrsStage,
} from '@/lib/srs'
import {
  Layers, Clock, ShieldCheck, GraduationCap, Play, Sparkles,
  PieChart, CalendarRange,
} from 'lucide-react'

export function DueReviewCard({ dueToday, onStart }: { dueToday: number; onStart: () => void }) {
  const t = useTranslations('dash')
  const tSrs = useTranslations('srs')
  const allCaughtUp = dueToday === 0

  return (
    <Card
      className={cn(
        'mb-6 border-border/40 bg-gradient-to-br from-green/10 to-card/50 backdrop-blur-sm cursor-pointer transition-all',
        'hover:border-green/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      {...activatable(onStart)}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-[42px] h-[42px] rounded-[10px] bg-green/15 flex items-center justify-center shrink-0">
            <Layers className="w-[18px] h-[18px] text-green" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('dueReviews')}</div>
            <div className="text-sm font-semibold truncate">
              {allCaughtUp ? t('allCaughtUp') : tSrs('wordsDue', { count: dueToday })}
            </div>
          </div>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-1.5 rounded-full bg-green/10 px-3 py-1.5 text-xs font-semibold text-green transition-colors duration-200">
          {t('reviewNow')} <Play className="w-3 h-3" />
        </div>
      </CardContent>
    </Card>
  )
}

const SRS_STAT_ICONS = [Layers, Clock, ShieldCheck, GraduationCap] as const

export function SrsStatCards({ stats }: { stats: ReturnType<typeof getCardStats> }) {
  const t = useTranslations('dash')
  const VALUES = [
    { value: stats.total, label: t('cardsInReview'), bg: 'bg-korean/15', iconText: 'text-korean' },
    { value: stats.dueToday, label: t('dueToday'), bg: 'bg-red/15', iconText: 'text-red' },
    { value: stats.mature, label: t('mature'), bg: 'bg-green/15', iconText: 'text-green' },
    { value: stats.learned, label: t('learned'), bg: 'bg-gold/15', iconText: 'text-gold' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {VALUES.map((item, i) => {
        const Icon = SRS_STAT_ICONS[i]
        return (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm hover:-translate-y-0.5 transition-transform">
            <CardContent className="p-4">
              <div className={cn('w-[34px] h-[34px] rounded-lg flex items-center justify-center mb-2.5', item.bg)}>
                <Icon className={cn('w-[15px] h-[15px]', item.iconText)} />
              </div>
              <div key={item.value} className="text-2xl font-bold leading-none mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {item.value}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const STAGE_COLORS: Record<SrsStage, string> = {
  new: 'var(--color-blue)',
  learning: 'var(--color-korean)',
  young: 'var(--color-gold)',
  mature: 'var(--color-green)',
}

function DeckDonut({ stats }: { stats: ReturnType<typeof getCardStats> }) {
  const t = useTranslations('srs')
  const total = stats.total

  const segments = useMemo(() => {
    type Seg = { key: string; label: string; count: number; color: string }
    const all: Seg[] = [
      { key: 'new', label: t('new'), count: stats.newCount, color: STAGE_COLORS.new },
      { key: 'learning', label: t('learning'), count: stats.learning, color: STAGE_COLORS.learning },
      { key: 'young', label: t('young'), count: stats.young, color: STAGE_COLORS.young },
      { key: 'mature', label: t('mature'), count: stats.mature, color: STAGE_COLORS.mature },
    ]
    return all
  }, [stats, t])

  const visible = segments.filter(s => s.count > 0)
  let acc = 0
  const circles = visible.map(s => {
    const frac = total > 0 ? s.count / total : 0
    const el = (
      <circle
        key={s.key}
        cx="21"
        cy="21"
        r="15.9155"
        fill="none"
        stroke={s.color}
        strokeWidth="3.5"
        pathLength={100}
        strokeDasharray={`${frac * 100} ${100 - frac * 100}`}
        strokeDashoffset={25 - acc * 100}
      />
    )
    acc += frac
    return el
  })

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          {total === 0 ? (
            <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--color-muted)" strokeWidth="3.5" pathLength={100} strokeDasharray="100 0" />
          ) : (
            circles
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none">{total}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">{t('cards')}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        {segments.map(s => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground truncate">{s.label}</span>
            <span className="font-semibold ml-auto pl-2 tabular-nums">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function worddayLabel(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' })
      .format(date)
      .slice(0, 2)
  } catch {
    return date.toDateString().slice(0, 2)
  }
}

function DueForecast({ cards }: { cards: Record<string, SrsCard> }) {
  const locale = useAppLocale()
  const t = useTranslations('srs')
  const forecast = useMemo(() => getForecast(cards, 7), [cards])
  const labels = useMemo(() => {
    const out: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      out.push(worddayLabel(d, locale))
    }
    return out
  }, [locale])

  const max = Math.max(1, ...forecast)

  return (
    <div>
      <div className="flex gap-1.5">
        {forecast.map((v, i) => (
          <div key={i} className="flex-1 text-center text-[10px] font-semibold tabular-nums text-muted-foreground">{v}</div>
        ))}
      </div>
      <div className="flex items-end gap-1.5 mt-1.5" style={{ height: 52 }}>
        {forecast.map((v, i) => (
          <div
            key={i}
            title={i === 0 ? t('today') : labels[i]}
            className={cn('flex-1 rounded-t-[3px] transition-all', i === 0 ? 'bg-gradient-to-t from-korean-dim to-korean' : 'bg-korean/25')}
            style={{ height: `${Math.max(5, (v / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {labels.map((label, i) => (
          <div key={i} className={cn('flex-1 text-center text-[10px]', i === 0 ? 'font-semibold text-korean' : 'text-muted-foreground')}>{label}</div>
        ))}
      </div>
    </div>
  )
}

function VisualCard({
  title, icon, children,
}: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-4">{icon} {title}</div>
        {children}
      </CardContent>
    </Card>
  )
}

export function SrsVisuals({ cards }: { cards: Record<string, SrsCard> }) {
  const t = useTranslations('dash')
  const stats = useMemo(() => getCardStats(cards), [cards])
  const hasDeck = stats.total > 0

  return (
    <div className="mb-6">
      <h3 className="text-[15px] font-semibold mb-3.5 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-korean" /> {t('vocabHealth')}
      </h3>
      {!hasDeck ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5 text-sm text-muted-foreground">
            {t('noWordsYet')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <VisualCard title={t('deckHealth')} icon={<PieChart className="h-4 w-4 text-korean" />}>
            <DeckDonut stats={stats} />
          </VisualCard>
          <VisualCard title={t('dueForecast')} icon={<CalendarRange className="h-4 w-4 text-korean" />}>
            <DueForecast cards={cards} />
          </VisualCard>
        </div>
      )}
    </div>
  )
}