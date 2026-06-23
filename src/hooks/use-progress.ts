/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { XP_PER_LESSON, XP_PER_LEVEL, units, getTotalLessons } from '@/lib/data'

const STORAGE_KEY = 'korean-study-progress'

interface ProgressData {
  completed: Record<string, number>
  streak: number
  lastStudyDate: string | null
  totalXp: number
  dailyActivity: Record<string, number>
}

function loadProgress(): ProgressData {
  if (typeof window === 'undefined') {
    return { completed: {}, streak: 0, lastStudyDate: null, totalXp: 0, dailyActivity: {} }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { completed: {}, streak: 0, lastStudyDate: null, totalXp: 0, dailyActivity: {} }
    const parsed = JSON.parse(raw)
    if (!parsed.completed) parsed.completed = {}
    if (typeof parsed.totalXp !== 'number') parsed.totalXp = 0
    if (typeof parsed.streak !== 'number') parsed.streak = 0
    if (!parsed.dailyActivity) parsed.dailyActivity = {}
    return parsed
  } catch {
    return { completed: {}, streak: 0, lastStudyDate: null, totalXp: 0, dailyActivity: {} }
  }
}

function saveProgress(data: ProgressData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function dateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>({
    completed: {}, streak: 0, lastStudyDate: null, totalXp: 0, dailyActivity: {}
  })

  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  const isCompleted = useCallback((unitId: string, lessonNum: number | string) => {
    return !!progress.completed[`${unitId}/${lessonNum}`]
  }, [progress.completed])

  const markComplete = useCallback((unitId: string, lessonNum: number | string) => {
    const p = loadProgress()
    const key = `${unitId}/${lessonNum}`
    const today = dateKey(new Date())

    if (p.completed[key]) {
      delete p.completed[key]
      p.totalXp = Math.max(0, p.totalXp - XP_PER_LESSON)
      if (p.dailyActivity[today]) {
        p.dailyActivity[today] = Math.max(0, p.dailyActivity[today] - 1)
        if (p.dailyActivity[today] === 0) delete p.dailyActivity[today]
      }
      saveProgress(p)
      setProgress({ ...p })
      return { action: 'unmarked' as const, xp: p.totalXp }
    }

    p.completed[key] = Date.now()
    p.totalXp += XP_PER_LESSON
    p.dailyActivity[today] = (p.dailyActivity[today] || 0) + 1

    const dateStr = new Date().toDateString()
    if (p.lastStudyDate !== dateStr) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      p.streak = p.lastStudyDate === yesterday ? p.streak + 1 : 1
      p.lastStudyDate = dateStr
    }
    const oldLevel = Math.floor((p.totalXp - XP_PER_LESSON) / XP_PER_LEVEL) + 1
    const newLevel = Math.floor(p.totalXp / XP_PER_LEVEL) + 1
    const leveledUp = newLevel > oldLevel
    saveProgress(p)
    setProgress({ ...p })
    return { action: 'marked' as const, xp: p.totalXp, streak: p.streak, leveledUp, newLevel }
  }, [])

  const getUnitCompletedCount = useCallback((unitId: string) => {
    const unit = units.find(u => u.id === unitId)
    if (!unit) return 0
    return unit.lessons.filter(l => isCompleted(unitId, l.id)).length
  }, [isCompleted])

  const getNextLesson = useCallback(() => {
    for (const unit of units) {
      for (const lesson of unit.lessons) {
        if (!isCompleted(unit.id, lesson.id)) {
          return { unitId: unit.id, num: lesson.id, title: lesson.title, unitName: unit.name }
        }
      }
    }
    return null
  }, [isCompleted])

  const getHeatmapData = useCallback(() => {
    const today = new Date()
    const weeks: string[][] = []
    const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']

    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)
    const startDay = startDate.getDay()
    const daysToMonday = startDay === 0 ? 6 : startDay - 1
    startDate.setDate(startDate.getDate() - daysToMonday)

    let currentWeek: string[] = []
    for (let i = 0; i < 371; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = dateKey(d)
      currentWeek.push(key)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push('')
      weeks.push(currentWeek)
    }

    return { weeks, dayLabels, activity: progress.dailyActivity }
  }, [progress.dailyActivity])

  const getStreakStats = useCallback(() => {
    let longestStreak = progress.streak
    const currentStreak = progress.streak
    const activeDays = Object.keys(progress.dailyActivity).length

    const sortedDates = Object.keys(progress.dailyActivity).sort()
    if (sortedDates.length > 0) {
      let tempStreak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1])
        const curr = new Date(sortedDates[i])
        const diff = (curr.getTime() - prev.getTime()) / 86400000
        if (diff === 1) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 1
        }
      }
    }

    return { currentStreak, longestStreak, activeDays }
  }, [progress.streak, progress.dailyActivity])

  const level = Math.floor(progress.totalXp / XP_PER_LEVEL) + 1
  const xpInLevel = progress.totalXp % XP_PER_LEVEL
  const completedCount = Object.keys(progress.completed).length
  const totalLessons = getTotalLessons()
  const overallPct = totalLessons > 0 ? Math.round(completedCount / totalLessons * 100) : 0

  return {
    mounted: true,
    streak: progress.streak,
    totalXp: progress.totalXp,
    level,
    xpInLevel,
    completedCount,
    totalLessons,
    overallPct,
    isCompleted,
    markComplete,
    getUnitCompletedCount,
    getNextLesson,
    getHeatmapData,
    getStreakStats,
    dailyActivity: progress.dailyActivity
  }
}