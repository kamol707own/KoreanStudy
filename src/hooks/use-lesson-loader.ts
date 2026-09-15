'use client'

import { useCallback, useRef } from 'react'

export function useLessonLoader() {
  const cacheRef = useRef<Record<string, string>>({})

  const loadLessonContent = useCallback(async (unitId: string, lessonNum: number | string): Promise<string | null> => {
    const cacheKey = `${unitId}/lesson${lessonNum}`
    if (cacheRef.current[cacheKey]) return cacheRef.current[cacheKey]

    try {
      const path = unitId === 'themes'
        ? `/lessons/themes/${lessonNum}.md`
        : `/lessons/${unitId}/lesson${lessonNum}.md`
      const response = await fetch(path)
      if (!response.ok) return null
      const md = await response.text()
      cacheRef.current[cacheKey] = md
      return md
    } catch {
      return null
    }
  }, [])

  return { loadLessonContent }
}