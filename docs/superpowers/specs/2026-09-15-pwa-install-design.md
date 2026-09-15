# PWA Install Design

Date: 2026-09-15

## Goal

Make the Study Korean site installable as an app from the browser (no APK, no
app store). Users on desktop Chrome/Edge and mobile Android get a native
install flow; iOS Safari users get a "Add to Home Screen" hint. No offline
caching, no service worker — install-only.

## Scope (explicitly out)

- No service worker, no offline support. The app always requires a
  connection.
- No push notifications.
- No APK or app-store packaging.

## Why install works without a service worker

Modern Chrome/Edge (108+) no longer require a service worker for installability;
a web app manifest + HTTPS + icons are enough. iOS "Add to Home Screen" works
through the manifest/meta tags alone. This matches the "online only" decision.

## Design

### 1. Web App Manifest — `src/app/manifest.ts`

New Next.js App Router metadata route, served at `/manifest.webmanifest`.

- `name`: "Study Korean"
- `short_name`: "KoreanStudy"
- `description`: from the existing `meta` messages
- `start_url`: `/en`
- `scope`: `/` (prevents the standalone window from being confined to `/en` only)
- `display`: `standalone`
- `background_color` / `theme_color`: `#f5f0eb` (light theme surface)
- `icons`:
  - `/icon-192.png` (192x192, `image/png`, `purpose: "any maskable"`)
  - `/icon-512.png` (512x512, `image/png`, `purpose: "any maskable"`)

### 2. Icons — generated once, committed

Generate from the existing `public/app-logo.png`:

- `public/icon-192.png`
- `public/icon-512.png`
- `public/apple-touch-icon.png` (180x180)

No runtime dependency; generated once and committed.

### 3. Metadata head — `src/app/[locale]/layout.tsx`

- Add `manifest: "/manifest.webmanifest"` and `appleWebApp` metadata
  (`capable`, `title`, `statusBarStyle`) to `generateMetadata`.
- Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` to the
  `<head>`.

### 4. Install hook — `src/hooks/use-pwa-install.ts`

Client hook that:

- Captures the browser's `beforeinstallprompt` event and exposes
  `promptInstall()`, which shows the native install dialog.
- Detects iOS Safari (`navigator.standalone === false` + iOS user agent) and
  exposes `isIOS`.
- Detects whether the app is already installed / standalone and exposes
  `canInstall`.
- On `appinstalled`, marks the app as installed so buttons hide.

### 5. Install button — `src/components/install-app-button.tsx`

- Renders nothing when the app is already installed or the browser doesn't
  support installs (with a hook to listen for `appinstalled`).
- Click behavior:
  - Has `beforeinstallprompt` → calls `promptInstall()` (native dialog).
  - iOS Safari → opens a small `AlertDialog` (radix) with "Share → Add to Home
    Screen" instructions, localized en/zh.
- Props: `variant` (icon/outline) and `collapsed` (sidebar rail) support.

### 6. Placement

- **Sidebar** (`src/components/sidebar.tsx`): a NavRow-style "Install app" row
  just above the account button in the expanded sidebar, and an icon button in
  the collapsed rail footer.
- **Landing page** (`src/app/[locale]/page.tsx`): an outline icon button next
  to the app logo in the top nav.

### 7. i18n

Add an `install` namespace to `messages/en.json` and `messages/zh.json`:
`installApp`, `installHintTitle`, `installHintBody`, `done`.

## Testing

- `next build` + `next lint` pass.
- Lighthouse PWA audit on the deployed/preview URL shows installable.
- Install button visible on Chrome desktop, triggers native dialog.
- On iOS Safari, button opens the Add to Home Screen hint.
- After install, the button disappears.