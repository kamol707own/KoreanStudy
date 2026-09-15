# Study Korean

A minimalistic guide to learning Korean, based on How to Study Korean — with
spaced-repetition flashcards, structured lessons, cloud sync, and a manual
transfer-payment subscription flow built on Supabase.

## Getting Started

First, copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) with your browser to
see the landing page.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) with a React 19 client
- **next-intl** for i18n — English is the source of truth, Chinese (zh) is
  localized; every locale deep-merges on top of English
- **Supabase** for auth, cloud sync, and billing data (see
  `supabase/migrations/`)
- **Tailwind CSS v4**

## i18n

Messages live in `messages/en.json` (source of truth) and `messages/zh.json`
(localized). Locales are configured in `src/i18n/routing.ts`. The runtime
merges English under any locale, so a missing key degrades gracefully.

## Supabase

Migrations in `supabase/migrations/` cover: profiles + avatar storage,
payments (orders, coupons, seller settings, payment-proofs storage bucket),
and account deletion.

- `NEXT_PUBLIC_SUPABASE_URL` / publishable key — client
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (delete-account + billing writes)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial. 
