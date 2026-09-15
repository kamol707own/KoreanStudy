// These MUST equal the app's ACTUAL background colors (globals.css:
// light --background: oklch(1 0 0) = #ffffff, dark --background:
// oklch(0.1 0.005 50) = #040302). The status bar, splash, and system bars are
// tinted from these, so if they drift from the real page background you get a
// visible beige/gray seam exactly where the OS chrome meets the app. Keep them
// in sync with globals.css whenever the palette changes.
// The status bar/splash/OS chrome are tinted from these, so they MUST be the
// EXACT sRGB equivalent of the app's real --background in globals.css — not an
// approximation (_oklch beats hex anyway, but if you use hexes make them
// exact). Light --background: oklch(1 0 0) = #ffffff. Dark --background:
// oklch(0.1 0.005 50) = #040302. When the palette changes, update BOTH here
// and in globals.css or the OS bars stop matching the page.
export const THEME_COLORS = {
  light: '#ffffff',
  dark: '#040302',
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