# Login Page Design Spec

## Overview

Add a dedicated `/[locale]/login` route with a clean, minimal auth page. Includes Google OAuth, email/password form, and a brief marketing value proposition. The existing `AuthSheet` slide-over remains for quick in-app sign-in.

## Goals

- Professional login page that builds trust and converts visitors
- Google OAuth as primary action (one-click sign-in)
- Email/password as fallback
- Brief marketing content (tagline + 3 feature highlights) to reinforce why the user should sign up
- New users see a brief welcome screen after first login; returning users go straight to the app
- Fully i18n-supported (en, zh)

## Non-goals

- Full marketing landing page (future work)
- Password reset flow (can be added later)
- Email verification flow beyond what Supabase already provides

---

## Architecture

### Route structure

```
src/app/[locale]/login/page.tsx   ← NEW — the login page
```

The page inherits the existing `[locale]/layout.tsx` (html/body/providers/fonts) but renders its own full-page content. The sidebar is only in `page.tsx`, so the login page is naturally sidebar-free.

### Auth changes

```
src/components/account-provider.tsx  ← MODIFY — add signInWithGoogle(), welcome screen state
```

Add to `AccountContextValue`:
- `signInWithGoogle(): Promise<Result<null>>` — triggers Supabase Google OAuth redirect
- `isNewUser: boolean` — true after first-ever sign-in (Supabase `user.created_at` within last 60 seconds)
- `dismissWelcome(): void` — clears the welcome state

### No changes needed

- `src/lib/supabase/client.ts` — already configured with PKCE, session persistence, `detectSessionInUrl: true`
- `src/middleware.ts` — stays i18n-only; no auth middleware needed (client-side auth)
- `src/components/auth-sheet.tsx` — kept as-is for in-app quick access

---

## UI Design

### Layout (desktop: ≥640px)

Two-column layout, centered vertically:

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   [Logo]          │      ┌──────────────────┐    │
│                   │      │  Continue with    │    │
│   Master Korean,  │      │  [G] Google      │    │
│   your way.       │      │                   │    │
│                   │      │  ─── or ───       │    │
│   ✓ Sync across   │      │  Email            │    │
│     devices       │      │  Password         │    │
│   ✓ Spaced        │      │                   │    │
│     repetition    │      │  [Sign in]        │    │
│   ✓ Structured    │      │                   │    │
│     curriculum    │      │  New here? Create │    │
│                   │      │  an account       │    │
│                   │      └──────────────────┘    │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Layout (mobile: <640px)

Single column, stacked:

```
┌───────────────────┐
│     [Logo]        │
│                   │
│  Master Korean,   │
│  your way.        │
│                   │
│  ✓ Sync across   │
│  ✓ Spaced rep    │
│  ✓ Curriculum    │
│                   │
│ ┌───────────────┐ │
│ │ [G] Google    │ │
│ │ ─── or ───    │ │
│ │ Email         │ │
│ │ Password      │ │
│ │ [Sign in]     │ │
│ │ Switch mode   │ │
│ └───────────────┘ │
└───────────────────┘
```

### Visual style

- Background: `bg-background` (respects dark/light theme)
- Card: `bg-card border border-border rounded-xl shadow-sm`
- Google button: white bg with Google "G" icon, `border border-border`
- Email/password inputs: existing `Input` component
- Submit button: existing `Button` with `bg-primary text-primary-foreground`
- Korean accent color (`--color-korean`) used for logo highlight and active states
- Geist font family (already loaded in layout)

### Marketing content (left side)

- **Logo:** `public/app-logo.png` (already exists, 240KB)
- **Tagline:** i18n key `login.tagline` — "Master Korean, your way."
- **Feature list:** 3 items, each with a Lucide icon + short text
  1. `Cloud` icon — `login.featureSync` — "Sync your progress across devices"
  2. `Brain` icon — `login.featureSrs` — "Spaced repetition for lasting memory"
  3. `BookOpen` icon — `login.featureCurriculum` — "Structured lessons from beginner to fluent"

### Auth card

1. **Google button:** Full-width, Lucide `Chrome` icon (or inline SVG Google logo), text "Continue with Google"
2. **Divider:** Horizontal line with "or" text centered
3. **Email input:** Labeled, placeholder `you@example.com`
4. **Password input:** Labeled, type=password
5. **Mode toggle:** Pill switch between "Sign in" and "Create account" (same pattern as current `AuthSheet`)
6. **Submit button:** Full-width, shows spinner when busy
7. **Error message:** Red text below form, uses existing i18n error keys
8. **Switch link:** "Already have an account? Sign in" / "New here? Create an account"

### Welcome screen (new users only)

After first successful sign-in, if `isNewUser` is true:

```
┌─────────────────────────────────────┐
│           [Logo]                     │
│                                      │
│     Welcome to Korean Study!         │
│                                      │
│  You're all set to start your        │
│  Korean learning journey. Your       │
│  progress will sync across all       │
│  your devices.                       │
│                                      │
│        [Start Learning →]            │
│                                      │
└─────────────────────────────────────┘
```

- Centered card, same visual style as login
- i18n keys: `welcome.title`, `welcome.description`, `welcome.cta`
- Clicking CTA calls `dismissWelcome()` and navigates to `/{locale}`

---

## Auth Flow

### Google OAuth

1. User clicks "Continue with Google"
2. `account-provider.tsx` calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/{locale}' } })`
3. Supabase redirects to Google consent screen
4. Google redirects back to Supabase callback URL
5. Supabase redirects to app with auth code in URL params
6. `detectSessionInUrl: true` (already configured) handles the PKCE exchange
7. `onAuthStateChange` fires `SIGNED_IN` → `applySession()` runs
8. If `user.created_at` is within 60 seconds of now → `isNewUser = true` → show welcome screen
9. Otherwise → navigate to `/{locale}` (main app)

### Email/password

Same as current flow, no changes. Works in both the new login page and the existing `AuthSheet`.

### New user detection

In `AccountProvider.applySession()`:
```ts
const createdAt = new Date(sessionUser.created_at ?? Date.now())
const isNew = Date.now() - createdAt.getTime() < 60_000
setIsNewUser(isNew)
```

Supabase `user` object has `created_at` — on first sign-up it's set to the current time. On subsequent logins it stays the original time. This avoids needing a separate "is this the first login?" check.

---

## i18n Keys

### English (`messages/en.json` — `login` namespace)

```json
{
  "tagline": "Master Korean, your way.",
  "featureSync": "Sync your progress across devices",
  "featureSrs": "Spaced repetition for lasting memory",
  "featureCurriculum": "Structured lessons from beginner to fluent",
  "or": "or",
  "continueWithGoogle": "Continue with Google"
}
```

### English (`messages/en.json` — `welcome` namespace)

```json
{
  "title": "Welcome to Korean Study!",
  "description": "You're all set to start your Korean learning journey. Your progress will sync across all your devices.",
  "cta": "Start Learning"
}
```

### Chinese (`messages/zh.json`)

Add corresponding `login.*` and `welcome.*` keys with Simplified Chinese translations.

---

## Files Summary

| File | Action | Description |
|---|---|---|
| `src/app/[locale]/login/page.tsx` | Create | Login page with marketing + auth card |
| `src/components/account-provider.tsx` | Modify | Add `signInWithGoogle()`, `isNewUser`, `dismissWelcome()` |
| `src/components/auth-sheet.tsx` | No change | Kept for in-app quick sign-in |
| `src/lib/supabase/client.ts` | No change | Already has PKCE + session persistence |
| `messages/en.json` | Modify | Add `login.*` and `welcome.*` keys |
| `messages/zh.json` | Modify | Add Chinese translations |
| `src/middleware.ts` | No change | Stays i18n-only |

---

## Testing Checklist

- [ ] `/en/login` renders without sidebar
- [ ] `/zh/login` renders with Chinese text
- [ ] Google button triggers OAuth flow
- [ ] Google OAuth redirect brings user back to app with active session
- [ ] Email/password sign-in works
- [ ] Email/password sign-up works (with email confirmation message)
- [ ] Mode toggle switches between sign-in and sign-up
- [ ] Error messages display correctly (wrong password, email taken, etc.)
- [ ] New users see welcome screen after first login
- [ ] Returning users skip welcome screen
- [ ] Dark/light theme works on login page
- [ ] Mobile responsive (stacked layout)
- [ ] Existing `AuthSheet` still works from sidebar
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
