# Spaced Repetition (SM-2) for Vocabulary — Design

Date: 2026-09-12
Status: Approved (Approach A — SM-2)

## Goal

Add a simple, working spaced-repetition system (Anki-style SM-2) so the user
memorizes Korean vocabulary. Also add dashboard visuals about the vocab learning
process. The feature is 100% client-side (localStorage), matching how lesson
progress/XP already work.

## Scope

- SM-2 scheduler per word (reps, lapses, interval, ease, due).
- Words enter the queue automatically when a lesson is marked complete, and
  manually via a `+` button on vocabulary rows.
- Flashcard review session as a **dedicated section** of the app, reachable from
  the sidebar, the dashboard "Due reviews" card, and a per-lesson button.
- Keyboard: `1 2 3 4` = Again/Hard/Good/Easy, `Space` = show answer / advance.
- Audio: browser TTS speaks the Korean word when the answer is revealed.
- Dashboard visuals: due-review card, 4 SRS stat cards, deck-health donut,
  7-day due forecast, review days in the heatmap, topic breakdown bars.

## Algorithm (src/lib/srs.ts — pure, no React)

SrsCard: `{ id, reps, lapses, interval (days), ease, due (ms), lastReview, addedAt }`.

First rating (reps === 0): Again → due today · Hard → 4d · Good → 7d · Easy → 14d.
Later ratings: Again → interval 0, ease −0.2 (floor 1.3), lapses++ · Hard → ×1.2 ·
Good → ×ease · Easy → ×ease×1.3, ease +0.15 (cap 3.0). Cap interval at 365d.

Stages for deck health: `new` (never reviewed) · `learning` (interval ≤ 1d) ·
`young` (interval < 21d) · `mature` (interval ≥ 21d).

Pure helpers: `createCard`, `nextReview(card, grade)`, `isDue`, `getStage`,
`getCardStats(cards)`, `getForecast(cards, days)`, `getDueIds(cards)`.

## Storage (src/hooks/use-srs.ts)

New localStorage key `korean-study-srs`, shape `{ version: 1, cards: {wordId → SrsCard},
activity: {"YYYY-MM-DD": n} }`. Mirrors use-progress (load in effect, save on
mutation). Public API: `mounted`, `cards`, `activity`, `addWords(ids)`,
`removeWords(ids)`, `reviewWord(id, grade)`, `getCard(id)`.

Vocabulary access (src/hooks/use-vocabulary.ts): shared client hook that fetches
`/vocabulary-data.json` (+ `/zh-vocab-dict.json` for zh) once and exposes
`{ vocabulary, zhDict, loading }`. `wordsForLesson(words, unitId, num)` helper
lives in `src/lib/vocabulary.ts`.

## Review session (src/components/review-session.tsx)

Route param `?r=` on the SPA:
- `?r=review` → all due cards.
- `?r=unit2/34` / `?r=themes/school` → that lesson's words (regardless of due).

Flow: front = Korean word + category badge + speaker button; click Show answer →
English (zh meaning when available) + auto TTS; four rating buttons
(Again/Hard/Good/Easy). "Again" re-queues the card at the end of the current
session. Header shows position `3/12` + progress bar. End screen shows reviewed
count, "Review again", "Back to dashboard". Grading writes back via
`reviewWord` (which also bumps daily `activity`).

## Dashboard visuals

- **Due reviews card**: prominent card at top; count of due words; click →
  `?r=review`. "All caught up" state when 0.
- **4 SRS stat cards** (second stat grid): Cards in review · Due today · Mature ·
  Learned (reps > 0). Animated numbers, same pattern as existing cards.
- **Deck health donut** (SVG, no chart lib): New / Learning / Young / Mature
  ring + legend.
- **7-day forecast**: hand-rolled bar chart of words due per day (days 0-6).
- **Heatmap**: review activity merged with lesson activity (sum per day).
- **Topic breakdown**: horizontal bars, learned/total cards per topic, top 8.

## i18n

New `srs` namespace in `messages/en.json`; new keys in `nav`, `dash`, `lesson`.
`zh.json` falls back to English via the existing deepMerge — no zh edits required.

## Files

- new `src/lib/srs.ts`, `src/hooks/use-srs.ts`, `src/hooks/use-vocabulary.ts`
- new `src/components/review-session.tsx`, `src/components/srs-visuals.tsx`
- edit `src/components/dashboard.tsx`, `src/components/sidebar.tsx`,
  `src/components/stats-panel.tsx`, `src/components/vocabulary-panel.tsx`,
  `src/components/lesson-view.tsx`, `src/app/[locale]/page.tsx`,
  `messages/en.json`, `src/lib/vocabulary.ts` (helper)

## Verification

`npm run lint` on both project copies (Downloads = running dev server, Desktop =
mirror), manual check of due card, review session, ratings persistence, keyboard
shortcuts, TTS, visuals, i18n on `/en` and `/zh`.