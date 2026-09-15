# i18n translation pipeline

Korean Study keeps **English as the single source of truth**. Translators never
edit English; they run the script, which fills in missing translations, and a
human reviewer later flags lesson content for review.

## What gets translated and where it lands

| Bucket | English source | Translated output | Review needed |
|---|---|---|---|
| A – UI strings | `messages/en.json` | `messages/{zh,vi,bn,ne}.json` | No |
| Short content (unit/lesson/theme/topic titles, vocab meanings) | derived from `src/lib/data.ts` + `src/lib/vocabulary.ts` via `scripts/i18n/dump-en.mts` | `src/lib/i18n/content.{locale}.json` | No |
| B – lesson bodies | `public/lessons/unit0-8/*.md` + `themes/*.md` | `public/lessons/{locale}/...` | **Yes** |

## Engines

Each locale maps to an engine in `ENGINES` at the top of `translate.mjs` —
change engines there, nothing else:

| Locale | Engine | Target code | Cost |
|---|---|---|---|
| `zh` | DeepL API | `zh-Hans` (simplified) | Free tier: **500K chars/month**, key in `.env` |
| `vi` | DeepL API | `vi` | same |
| `bn` | LibreTranslate (local) | `bn` | Free, unlimited, no key |
| `ne` | LibreTranslate (local) | `ne` | Free, unlimited, no key |

Credentials are read from `.env.local` / `.env` (copy `.env.example`, fill in
`DEEPL_API_KEY`). Real environment variables take precedence if you prefer to
export them inline instead.

- **DeepL** (zh, vi): sign up at deepl.com/pro-api (free tier, no card).
  Free keys end in `:fx` — the script then uses the `api-free.deepl.com`
  endpoint automatically.
- **LibreTranslate** (bn, ne): run locally in Docker, no API key:
  ```bash
  docker run -it --rm -p 5000:5000 libretranslate/libretranslate
  ```
  The script posts to `http://localhost:5000/translate` (override the host
  with `LIBRETRANSLATE_URL`). If your container lacks the bn/ne language
  model, requests for that locale fail per-batch with a logged warning and
  the run keeps going.

## Running a translation

```bash
# Estimate quota usage & see what would be translated (no API call, no writes)
npm run i18n:dry -- --langs zh

# Translate for real
npm run i18n:translate -- --langs zh     # DeepL — needs DEEPL_API_KEY in .env
npm run i18n:translate -- --langs bn     # LibreTranslate — container on :5000
```

- `--langs zh` – pick from `zh, vi, bn, ne`.
- `--force` – re-translate files/keys that already exist (normally skipped so
  re-runs only handle diffs after English edits).

### Quota plan (DeepL only)

Check the live budget before running:

```bash
KEY=$(grep '^DEEPL_API_KEY=' .env | cut -d= -f2-)
curl -s -H "Authorization: DeepL-Auth-Key $KEY" https://api-free.deepl.com/v2/usage
# → {"character_count":…, "character_limit":…}
```

The free allowance resets monthly; when `character_count == character_limit`
the translator aborts cleanly on the first request (DeepL HTTP 456, nothing is
charged). Re-run after the reset — skip logic resumes exactly where it
stopped.

**Chinese status (measured 2026-09-05, dry run with skip logic):**

| Item | Chars | Status |
|---|---|---|
| UI strings (`messages/zh.json`) | ~1K | ✅ done |
| Titles + vocab (`content.zh.json`) | ~7.8K | ⏳ reset to `{}` — re-run fills it |
| Lesson bodies | **~1.23M total** | ⏳ **48/205 files done** |
| → Remaining lessons | ~642K | ≈ 0.65 × one 1M month |

Healthy files by unit (48): themes 5/5, unit0 3/3, unit1 13/25, unit2 15/25,
unit3 12/25. Missing: 12 + 10 + 13 in units 1–3 plus all of unit4–8 (later
units are heavy: unit5 ≈ 161K en chars, unit8 ≈ 254K en chars — a run that
starts with units 1–3 done will typically finish unit4/unit6/unit7 and part
of unit5/unit8 before hitting the cap, then resume next month).

**Conclusion: the remaining zh work fits in a single monthly quota period**
(≈650K chars total incl. content). One command finishes everything after the
reset:

```bash
npm run i18n:dry -- --langs zh     # plan (no API)
npm run i18n:translate -- --langs zh  # run once after the monthly reset
node scripts/i18n/prune-corrupt.mjs zh   # sanity check afterwards
```

LibreTranslate (bn, ne) is unlimited, so each of those finishes in a single
run whenever you get to them. Every run appends its totals to
`scripts/i18n/quota.log`; failed/retried batches are counted as `failed=` in
the per-locale summary and nothing partial is written for them.

## How lesson translation stays safe

Korean is **never sent to the translation engine**. Before every request:

1. Hangul phrases (runs separated only by whitespace are grouped so internal
   spaces survive) and URLs are swapped for empty tags `<k0></k0> …` held in a
   per-fragment registry (`planText`). After translation the tags are stitched
   back to the exact original Korean (`stitch`). Engines translate text inside
   `<span>` tags, so wrapping (the old approach) corrupted Korean — tags are
   opaque and contain nothing, so there is nothing to translate.
2. Markdown bold markers that hug a phrase (`**ㅏ**`) are folded into the
   protected phrase, since engines mangle asterisks adjacent to tags.
3. Each `.md` file is split into blocks (headings, paragraphs, lists, tables).
   List items are translated one line at a time.
4. Table **header rows** (the row above the `---` separator) are translated
   whole so short column titles keep context. Table **body rows are translated
   cell by cell** — pure-Korean cells are never sent at all, so the engine
   cannot reflow or drop Korean across columns. (Whole-row translation let
   DeepL scramble cells like `저는 ___에서 왔어요` into `___저는에서`.)
5. Fragments are batched into a handful of requests per file (DeepL is paced
   by an adaptive chars/sec throttle and retried with backoff on 429/network
   errors).
6. Responses carrying protected tags are validated — every tag must come back
   exactly once, in order. Corrupt fragments are re-sent solo; a file is only
   written when every fragment is healthy, otherwise it stays for the next run
   (English fallback keeps showing meanwhile).
7. The free DeepL tier occasionally appends its own language name (e.g.
   `简体中文（大陆）`) to short segments and HTML-escapes `&` — `sanitize()`
   strips/decodes that.

### Healing damaged files after a bad run

`scripts/i18n/prune-corrupt.mjs` compares each translated lesson's Korean
against the English source (multiset of Hangul runs) and lists — or with
`--delete` removes — files whose Korean got dropped or duplicated:

```bash
node scripts/i18n/prune-corrupt.mjs zh            # list damaged files
node scripts/i18n/prune-corrupt.mjs zh --delete   # remove them
npm run i18n:translate -- --langs zh              # regenerate just those
```

Run this after any interrupted/experimental run before trusting the output.

## Review workflow for lessons (Bucket B)

Every file the script translates is recorded in
`scripts/i18n/review-status.{locale}.json`:

```json
{
  "unit1:lesson1": { "translatedAt": "…", "reviewed": false }
}
```

After a native speaker reviews a lesson, flip `"reviewed": true`. That file is
a dev tracker only — the app never reads it.

## Adding a future language (e.g. ru, uz)

1. Add the locale to `locales` in `src/i18n/routing.ts`.
2. Add a row to `ENGINES` in `scripts/i18n/translate.mjs` mapping it to a
   DeepL or LibreTranslate target code.
3. Add UI font + Google Fonts href for its script in `src/app/[locale]/layout.tsx`.
4. Create `messages/{lang}.json` and `src/lib/i18n/content.{lang}.json` as `{}`.
5. Run `npm run i18n:translate -- --langs <lang>`.

## Editing content going forward

- Edit **only** English: lesson `.md` files, `messages/en.json`, `data.ts`,
  `vocabulary.ts`.
- Re-run the script per language to refresh the diffs.
- Never hand-edit a translated lesson or `content.{locale}.json` except during
  the review pass.
