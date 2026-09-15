/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppLocale } from '@/i18n/use-app-locale'
import type { VocabularyWord } from '@/lib/vocabulary'

interface VocabularyState {
  vocabulary: VocabularyWord[]
  zhDict: Record<string, string>
  loading: boolean
  ready: boolean
}

/**
 * Shared client-side loader for the vocabulary dataset. Fetching once here
 * avoids every view that needs the words duplicating the fetch.
 */
export function useVocabulary(): VocabularyState {
  const locale = useAppLocale()
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([])
  const [zhDict, setZhDict] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetch('/vocabulary-data.json').then(res => (res.ok ? res.json() : Promise.reject(new Error('no vocab data')))),
      locale === 'zh'
        ? fetch('/zh-vocab-dict.json').then(res => (res.ok ? res.json() : {})).catch(() => ({}))
        : Promise.resolve({}),
    ])
      .then(([vocabData, dictData]) => {
        if (cancelled) return
        setVocabulary(vocabData)
        setZhDict(dictData)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [locale])

  useEffect(reload, [reload])

  return { vocabulary, zhDict, loading, ready: !loading }
}