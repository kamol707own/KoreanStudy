# Login Page Implementation Plan

Based on spec: `2026-09-14-login-page-design.md`

---

## Phase 1: i18n Keys (do first — other files depend on these)

### Step 1: Add English keys to `messages/en.json`

Add under the existing `auth` namespace:
```json
"login": {
  "tagline": "Master Korean, your way.",
  "featureSync": "Sync your progress across devices",
  "featureSrs": "Spaced repetition for lasting memory",
  "featureCurriculum": "Structured lessons from beginner to fluent",
  "or": "or",
  "continueWithGoogle": "Continue with Google"
}
```

Add new `welcome` namespace:
```json
"welcome": {
  "title": "Welcome to Korean Study!",
  "description": "You're all set to start your Korean learning journey. Your progress will sync across all your devices.",
  "cta": "Start Learning"
}
```

### Step 2: Add Chinese keys to `messages/zh.json`

Add corresponding `login.*` and `welcome.*` keys with Simplified Chinese translations.

---

## Phase 2: Account Provider (auth logic)

### Step 3: Modify `src/components/account-provider.tsx`

Add to `AccountContextValue` interface:
- `signInWithGoogle: () => Promise<Result<null>>`
- `isNewUser: boolean`
- `dismissWelcome: () => void`

Add state:
- `const [isNewUser, setIsNewUser] = useState(false)`

Modify `applySession()`:
- After setting user, check `sessionUser.created_at`
- If `Date.now() - new Date(created_at).getTime() < 60_000` → `setIsNewUser(true)`

Add `signInWithGoogle` callback:
```ts
const signInWithGoogle = useCallback(async () => {
  const supabase = getSupabaseClient()
  if (!supabase) return fail('genericError')
  setBusy('signin')
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    })
    if (error) return fail('genericError')
    return ok(null)
  } catch {
    return fail('genericError')
  } finally {
    setBusy(null)
  }
}, [])
```

Add `dismissWelcome` callback:
```ts
const dismissWelcome = useCallback(() => setIsNewUser(false), [])
```

Add all new values to the context `value` useMemo.

---

## Phase 3: Login Page

### Step 4: Create `src/app/[locale]/login/page.tsx`

Build the page with these sections:

**Left column (marketing):**
- Import `app-logo.png` from public (use `next/image` or plain `<img>`)
- Tagline from `login.tagline`
- 3 feature items with Lucide icons (`Cloud`, `Brain`, `BookOpen`)
- Hidden on mobile (`hidden sm:flex`)

**Right column (auth card):**
- Google button: full-width, `Chrome` icon from Lucide, calls `signInWithGoogle()`
- Divider with "or" text
- Email input (existing `Input` component)
- Password input (existing `Input` component)
- Mode toggle pill (signin/signup) — same pattern as `AuthSheet`
- Submit button with spinner
- Error display using existing i18n keys
- Switch mode link

**Welcome overlay:**
- Conditionally render when `isNewUser && user`
- Centered card with logo, title, description, CTA button
- CTA calls `dismissWelcome()` and navigates to `/{locale}`

**Page structure:**
- `'use client'` directive (needs hooks)
- Use `useAccount()` for auth state
- Use `useTranslations('auth')` and `useTranslations('login')` and `useTranslations('welcome')`
- Use `useRouter()` from `next-intl/navigation` for redirect
- Use existing `Button`, `Input` components from `@/components/ui/`
- Use `cn()` from `@/lib/utils` for conditional classes

---

## Phase 4: Polish & Verify

### Step 5: Update sidebar sign-in link

In `src/components/sidebar.tsx`, the `AccountButton` calls `openAuth()` to open the sheet. Consider adding a "Full login page" link or keep the sheet as the primary in-app method. **Decision: keep as-is** — the sheet is convenient for quick in-app access.

### Step 6: Verify build

```bash
npm run build
npm run lint
```

### Step 7: Manual testing

- [ ] Navigate to `/en/login` — page renders without sidebar
- [ ] Navigate to `/zh/login` — Chinese text renders
- [ ] Click "Continue with Google" — OAuth flow starts
- [ ] Complete Google sign-in — redirected back with session
- [ ] Sign in with email/password — works
- [ ] Sign up with email/password — works, shows "check email" message
- [ ] Toggle between sign-in/sign-up modes — form updates
- [ ] Error states display correctly
- [ ] New user sees welcome screen
- [ ] Returning user skips welcome screen
- [ ] Dark/light theme both look correct
- [ ] Mobile responsive (stacked layout)
- [ ] Existing `AuthSheet` from sidebar still works

---

## Execution Order

1. **Step 1-2:** i18n keys (no risk, just JSON)
2. **Step 3:** Account provider changes (additive, doesn't break existing auth)
3. **Step 4:** Login page (new file, no conflicts)
4. **Step 5-7:** Verify everything works

Total estimated changes:
- 2 files modified (`messages/en.json`, `messages/zh.json`, `src/components/account-provider.tsx`)
- 1 file created (`src/app/[locale]/login/page.tsx`)
- ~200-300 lines of new code
