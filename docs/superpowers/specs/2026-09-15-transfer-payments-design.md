# Transfer-Based Payments with Screenshot Proof

Date: 2026-09-15

## Goal

Replace the fake "card entry" payment form with a real manual transfer flow:

- The site owner (admin) publishes their receiving card number + name.
- Users pay by transferring money to that card, optionally uploading a screenshot as proof.
- The owner sees a running balance (sum of approved order amounts) and each paid user's details, including their screenshot.

## Decisions (confirmed with user)

- Card entry form is **replaced** by a transfer-to-owner flow (no more fake card fields).
- Screenshots uploaded to **Supabase Storage**, **optional**.
- Bucket is **private**; only the uploader (owner) and the admin see proofs, via signed URLs.
- Balance = sum of **approved** order amounts.
- Paid-user details shown by **enhancing the existing admin orders tab**.
- Owner's receiving card details are **editable in the admin panel** (Settings tab), persisted to DB, surfaced live on the landing page.

## Architecture

### Database (migration `0005`)
- `settings` table (key-value singleton rows); RLS denies everything to anon/authenticated — server writes via service_role, a public GET endpoint reads it.
  - Keys: `seller_card_number`, `seller_card_name`.
- `orders.proof_path text` added — path to the uploaded screenshot in storage.
- Existing `card_number / card_holder / card_expiry` columns become unused but remain (backward compat / manual charging reference).

### Storage
- New **private** bucket `payment-proofs`.
- RLS: `authenticated` may insert/read only objects under `{auth.uid()}/`; `service_role` bypasses RLS. Bucket uploads are client-side using the user's own session (mirrors the `avatars` pattern in `account-provider.tsx`).

### API routes
- `GET /api/commerce` (public) → `{ sellerCardNumber, sellerCardName }` for the landing pricing card.
- `POST /api/subscribe` — remove card validation; accept optional `proofPath`; store it on the order. Amount / coupon reservation / pending-duplicate logic unchanged.
- `GET /api/admin/settings` + `PUT /api/admin/settings` (admin-only via `requireAdmin`) → read/update seller card info in `settings`.
- `GET /api/admin/orders` — augment each order with `proofUrl` (a short-lived signed URL) when a `proof_path` exists.

### Client
- Landing pricing card (`PaymentForm` in `[locale]/page.tsx`):
  - Fetches `GET /api/commerce` to show a "Pay to" box: card number + name + amount due.
  - Optional image picker (accept png/jpg/webp, API by the same `uploadProof` flow). Uploads directly to `payment-proofs/<uid>/<uuid>.<ext>` with the user's session.
  - Submit sends `{ proofPath, coupon }`; success / pending states unchanged.
- Admin panel (`[locale]/admin/page.tsx`):
  - Summary strip on top: **Balance** = `sum(orders where status = approved)`, shown in won.
  - Orders tab: each order shows email, amount, plan month, date, status, and a thumbnail/click-to-view link when `proofUrl` present.
  - New **Settings** tab: form with seller card number + name, saved via `PUT /api/admin/settings`.

## Error handling
- Missing/invalid proofs: upload failures surface `uploadFailed` (admin-readable translation key) without blocking the order (proof is optional).
- `settings` not configured: landing page shows a "payment info not configured — contact support" placeholder instead of the pay-to box.

## Testing
- Migration applied to the live Supabase project via Management API.
- Storage bucket + RLS verified with service_role and an authenticated test user (upload → read own → denied other's path → admin signed URL succeeds).
- `npm run build` green.
- Manual E2E: admin sets card info → user sees it → user (no proof) submits → order pending; user (with proof) submits → proof visible in admin panel; approve → access granted; balance reflects approved amounts.

## Out of Scope
- No real payment processor (Stripe, etc.) — transfer tracking is manual by design.
- No email notifications (existing manual-approval flow stays).