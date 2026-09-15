import { useLocale } from 'next-intl'
import { locales, type AppLocale } from './routing'

/**
 * Wraps next-intl's useLocale with the app's concrete locale union so
 * callers can index translation sidecars without casting.
 */
export function useAppLocale(): AppLocale {
  const locale = useLocale()
  return locales.includes(locale as AppLocale) ? (locale as AppLocale) : 'en'
}
