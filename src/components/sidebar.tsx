'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { units, themes } from '@/lib/data'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  BookOpen, Languages, MessageSquare, GraduationCap, FlaskConical,
  Brain, Sparkles, Trophy, School, Bus, UtensilsCrossed, ShoppingBag,
  CloudSun, Search, ChevronRight, Check, Menu, PanelLeftClose, PanelLeftOpen,
  Home, BookMarked
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Languages, MessageSquare, GraduationCap, FlaskConical,
  Brain, Sparkles, Trophy, School, Bus, UtensilsCrossed, ShoppingBag, CloudSun
}

interface SidebarProps {
  currentLesson: { unit: string; num: number | string } | null
  onSelectLesson: (unitId: string, num: number | string, title: string) => void
  onSelectTheme: (themeId: string, title: string) => void
  onGoHome: () => void
  onGoToVocabulary?: () => void
  isCompleted: (unitId: string, lessonNum: number | string) => boolean
  getUnitCompletedCount: (unitId: string) => number
  isCollapsed: boolean
  onToggleCollapse: () => void
}

function SidebarContent({
  currentLesson, onSelectLesson, onSelectTheme, onGoHome, onGoToVocabulary,
  isCompleted, getUnitCompletedCount, onNavigate
}: SidebarProps & { onNavigate?: () => void }) {
  const [search, setSearch] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleLessonClick = (unitId: string, num: number | string, title: string) => {
    onSelectLesson(unitId, num, title)
    onNavigate?.()
  }

  const handleThemeClick = (themeId: string, title: string) => {
    onSelectTheme(themeId, title)
    onNavigate?.()
  }

  const filterMatch = (text: string) => {
    if (!search) return true
    return text.toLowerCase().includes(search.toLowerCase())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/50"
          />
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 h-9 px-3 text-sm font-medium"
            onClick={onGoHome}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 h-9 px-3 text-sm font-medium"
            onClick={onGoToVocabulary}
          >
            <BookMarked className="w-4 h-4" />
            Vocabulary
          </Button>

          <Separator className="my-2" />

          {units.map(unit => {
            const isOpen = openSections[unit.id] ?? (currentLesson?.unit === unit.id)
            const done = getUnitCompletedCount(unit.id)
            const total = unit.lessons.length
            const pct = total > 0 ? Math.round(done / total * 100) : 0
            const Icon = iconMap[unit.icon] || BookOpen

            const hasMatch = unit.lessons.some(l => filterMatch(`Lesson ${l.id}: ${l.title}`))
            if (search && !hasMatch) return null

            return (
              <Collapsible key={unit.id} open={isOpen} onOpenChange={() => toggleSection(unit.id)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between h-9 px-3 text-sm font-medium",
                      isOpen ? "text-korean" : ""
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {unit.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {pct > 0 && <Badge variant="success" className="text-[10px] px-1.5 py-0">{pct}%</Badge>}
                      <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-90")} />
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4 border-l border-border pl-2 mt-0.5 mb-1">
                  {unit.lessons.map(lesson => {
                    const isActive = currentLesson?.unit === unit.id && currentLesson?.num === lesson.id
                    const done = isCompleted(unit.id, lesson.id)
                    const label = `Lesson ${lesson.id}: ${lesson.title}`

                    if (search && !filterMatch(label)) return null

                    return (
                      <Button
                        key={lesson.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-8 px-2 text-xs font-normal",
                          isActive ? "text-korean bg-korean/10" : "text-muted-foreground"
                        )}
                        onClick={() => handleLessonClick(unit.id, lesson.id, lesson.title)}
                      >
                        <span className="truncate">{label}</span>
                        {done && <Check className="w-3 h-3 text-green ml-auto shrink-0" />}
                      </Button>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          })}

          <Collapsible open={openSections['themes'] ?? false} onOpenChange={() => toggleSection('themes')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between h-9 px-3 text-sm font-medium",
                  openSections['themes'] ? "text-korean" : ""
                )}
              >
                <span className="flex items-center gap-2.5">
                  <School className="w-4 h-4" />
                  Themes
                </span>
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", openSections['themes'] && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4 border-l border-border pl-2 mt-0.5 mb-1">
              {themes.map(theme => {
                const isActive = currentLesson?.unit === 'themes' && currentLesson?.num === theme.id
                const done = isCompleted('themes', theme.id)

                return (
                  <Button
                    key={theme.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 px-2 text-xs font-normal",
                      isActive ? "text-korean bg-korean/10" : "text-muted-foreground"
                    )}
                    onClick={() => handleThemeClick(theme.id, theme.title)}
                  >
                    <span className="truncate">{theme.title}</span>
                    {done && <Check className="w-3 h-3 text-green ml-auto shrink-0" />}
                  </Button>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </ScrollArea>
    </div>
  )
}

export function Sidebar({
  currentLesson, onSelectLesson, onSelectTheme, onGoHome, onGoToVocabulary,
  isCompleted, getUnitCompletedCount, isCollapsed, onToggleCollapse
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 bottom-0 bg-card border-r border-border z-50 flex-col transition-all duration-300",
          isCollapsed ? "w-[68px]" : "w-[280px]"
        )}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-korean to-creamy flex items-center justify-center font-bold text-background cursor-pointer"
                 onClick={onGoHome}>
              한
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleCollapse}>
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
            <Separator />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onGoHome}>
              <Home className="w-4 h-4" />
            </Button>
            {units.map(unit => {
              const Icon = iconMap[unit.icon] || BookOpen
              const firstLesson = unit.lessons[0]
              return (
                <Button
                  key={unit.id}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title={unit.name}
                  onClick={() => onSelectLesson(unit.id, firstLesson.id, firstLesson.title)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              )
            })}
          </div>
        ) : (
          <>
            <div className="p-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-korean to-creamy flex items-center justify-center font-bold text-background cursor-pointer"
                     onClick={onGoHome}>
                  한
                </div>
                <span className="text-base font-semibold">
                  Korean <span className="text-korean">Study</span>
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleCollapse}>
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
            <SidebarContent
              currentLesson={currentLesson}
              onSelectLesson={onSelectLesson}
              onSelectTheme={onSelectTheme}
              onGoHome={onGoHome}
              onGoToVocabulary={onGoToVocabulary}
              isCompleted={isCompleted}
              getUnitCompletedCount={getUnitCompletedCount}
              isCollapsed={isCollapsed}
              onToggleCollapse={onToggleCollapse}
            />
          </>
        )}
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-40 h-10 w-10 bg-card/80 backdrop-blur-sm border border-border shadow-sm lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent
              currentLesson={currentLesson}
              onSelectLesson={onSelectLesson}
              onSelectTheme={onSelectTheme}
              onGoHome={onGoHome}
              onGoToVocabulary={onGoToVocabulary}
              isCompleted={isCompleted}
              getUnitCompletedCount={getUnitCompletedCount}
              isCollapsed={false}
              onToggleCollapse={onToggleCollapse}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}