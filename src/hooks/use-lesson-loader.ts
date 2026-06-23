'use client'

import { useState, useCallback } from 'react'

export function useLessonLoader() {
  const [lessonCache, setLessonCache] = useState<Record<string, string>>({})

  const loadLessonContent = useCallback(async (unitId: string, lessonNum: number | string): Promise<string | null> => {
    const cacheKey = `${unitId}/lesson${lessonNum}`
    if (lessonCache[cacheKey]) return lessonCache[cacheKey]

    try {
      let path: string
      if (unitId === 'themes') {
        path = `/lessons/themes/${lessonNum}.md`
      } else {
        path = `/lessons/${unitId}/lesson${lessonNum}.md`
      }
      const response = await fetch(path)
      if (!response.ok) return null
      const md = await response.text()
      setLessonCache(prev => ({ ...prev, [cacheKey]: md }))
      return md
    } catch {
      return null
    }
  }, [lessonCache])

  return { loadLessonContent }
}