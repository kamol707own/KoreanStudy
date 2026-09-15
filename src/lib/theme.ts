export const THEME_COLORS = {
  light: '#f5f0eb',
  dark: '#0a0a0a',
} as const

export type Theme = keyof typeof THEME_COLORS

/** Resolves any stored theme value to a known theme, defaulting to dark. */
export function resolveTheme(value: string | null | undefined): Theme {
  return value === 'light' ? 'light' : 'dark'
}

/**
 * Keeps the browser status bar (meta theme-color) in sync with the app theme —
 * Telegram-style: the status bar matches the page background and flips when
 * the theme flips. The meta tag is server-rendered from the theme cookie, so
 * fresh loads are already correct; this handles runtime toggles.
 */
export function syncThemeColor(theme: Theme) {
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[theme])
}

/** Applies a theme to <html>, persists it, and syncs the status bar color. */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.cookie = `korean-study-theme=${theme};path=/;max-age=31536000;samesite=lax`
  syncThemeColor(theme)
}