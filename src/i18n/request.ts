import { getRequestConfig } from 'next-intl/server'
import type { AppLocale } from './routing'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Deep-merge `base` with `override` (override wins). Used so every locale
 * falls back to the English source of truth for keys it does not have yet.
 */
export function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(base[key])) {
      out[key] = deepMerge(base[key] as Record<string, unknown>, value)
    } else {
      out[key] = value
    }
  }
  return out
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: AppLocale = (requested ?? 'en') as AppLocale

  const english = (await import(`../../messages/en.json`)).default as Record<
    string,
    unknown
  >
  const localized =
    locale === 'en'
      ? {}
      : ((await import(`../../messages/${locale}.json`)).default as Record<
          string,
          unknown
        >)

  return {
    locale,
    messages: deepMerge(english, localized),
  }
})
