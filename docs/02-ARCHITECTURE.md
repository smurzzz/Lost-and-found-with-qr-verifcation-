# ClaimIt — Architecture

## 1. System overview

```
┌─────────────────────┐        ┌─────────────────────┐
│   Expo / React       │  HTTPS │   Supabase           │
│   Native App          │◄──────►│  - Postgres DB       │
│   (Android)           │        │  - Storage (photos)  │
│                       │        │  - Edge Functions    │
│                       │        │  - RLS (JWT-gated)   │
└──────────┬────────────┘        └──────────────────────┘
           │
           │ Auth (Google SSO via Clerk; `supabase` JWT template → RLS)
           ▼
     ┌───────────────┐
     │ Clerk (SSO)   │   Google OAuth handled by Clerk — no Google Cloud app of our own
     └───────────────┘
```

## 2. Layers

- **Presentation** — Expo Router screens, organized by role (`/app/(student)/...`, `/app/(staff)/...`).
- **State/data** — React Query (or SWR) for server state; local component state for forms.
- **API** — Supabase Edge Functions / Postgres RPC for anything that mutates status (especially release), so the "staff-scan-only" rule lives server-side, not in a client screen.
- **Data** — Postgres tables via Supabase, Row-Level Security (RLS) enforcing role-based access.

## 3. Data model (minimum viable schema)

**users**

| column        | type                        | notes                                                                                                       |
| ------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| id            | text                        | Clerk user id (like `user_2xY…`); synced to `users` on first login; RLS resolves `auth.jwt()->>'sub'` to it |
| role          | enum(student, staff, admin) |                                                                                                             |
| name          | text                        |                                                                                                             |
| email         | text                        | any Google account accepted (open signup)                                                                   |
| class_or_dept | text                        | optional                                                                                                    |

**items**

| column         | type                                                     | notes                       |
| -------------- | -------------------------------------------------------- | --------------------------- |
| id             | uuid                                                     |                             |
| title          | text                                                     |                             |
| category       | text                                                     |                             |
| description    | text                                                     |                             |
| photo_url      | text                                                     | nullable                    |
| found_location | text                                                     |                             |
| found_date     | timestamp                                                |                             |
| source         | enum(staff_logged, student_reported)                     |                             |
| reported_by    | uuid → users                                             | nullable if staff_logged    |
| status         | enum(pending_dropoff, available, pending_claim, claimed) |                             |
| qr_code        | text                                                     | nullable until confirmed    |
| confirmed_by   | uuid → users                                             | staff who confirmed receipt |
| confirmed_at   | timestamp                                                | nullable                    |
| created_at     | timestamp                                                |                             |

**lost_reports**

| column        | type                                             | notes |
| ------------- | ------------------------------------------------ | ----- |
| id            | uuid                                             |       |
| reported_by   | uuid → users                                     |       |
| category      | text                                             |       |
| description   | text                                             |       |
| lost_location | text                                             |       |
| lost_date     | timestamp                                        |       |
| status        | enum(searching, possible_match, claimed, closed) |       |

**claims**

| column              | type                              | notes |
| ------------------- | --------------------------------- | ----- |
| id                  | uuid                              |       |
| item_id             | uuid → items                      |       |
| claimant_id         | uuid → users                      |       |
| verification_answer | text                              |       |
| status              | enum(pending, approved, released) |       |
| created_at          | timestamp                         |       |

**audit_log**

| column     | type                                                                 | notes                        |
| ---------- | -------------------------------------------------------------------- | ---------------------------- |
| id         | uuid                                                                 |                              |
| item_id    | uuid → items                                                         |                              |
| event_type | enum(reported, confirmed, found, matched, claim_requested, released) |                              |
| actor_id   | uuid → users                                                         | nullable for "system" events |
| note       | text                                                                 |                              |
| created_at | timestamp                                                            |                              |

**Who writes audit rows.** Staff/service-role Edge Functions write `found`, `confirmed`, `matched`, and `released` directly (they bypass RLS). Student-originated transitions — `reported` when a student files a found item, and `claim_requested` when a claim is filed — are auto-created by SECURITY DEFINER triggers from migration `20250924000006_phase10_audit_auto.sql`, because students hold no `audit_log` INSERT rights (`audit_log_insert_staff` is staff/admin-only). `audit_log` stays append-only: no UPDATE/DELETE policies exist on it.

## 4. The non-negotiable constraint

Item status can only transition to `claimed` through a single server-side endpoint:

```
POST /functions/v1/release          (the Release Edge Function; Supabase hosts
                                     each function at /functions/v1/<name>)
body: { itemId, claimId, scannedQrCode }
```

(Phase 9 note: the earlier `/api/items/:id/release` path form is legacy — Supabase
invokes functions at `/functions/v1/release`, so a body-free `/items/:id/release`
route could never be reached from the native client. `itemId` now travels in the
request body.)

This endpoint:

1. Verifies the caller has an authenticated **staff** session.
2. Verifies `scannedQrCode` matches the item's stored `qr_code` (the binding gate); signed-format tokens additionally pass server-side HMAC signature verification (`isSignedQrValid` — a scanned tag is never trusted from the client decode alone).
3. Verifies the referenced `claimId` is `approved` (and belongs to that item).
4. Writes the `released` audit_log row.
5. Only then updates `items.status = 'claimed'`.

**QR tags are signed tokens (09 §8/§11):** `qr_code` stores `<itemId>.<sig>` where `sig = base64url(HMAC-SHA256(itemId, CLAIMIT_QR_SECRET))`. The token is minted **only** server-side (Edge Functions, via the shared `_shared/claimit.ts` mint) and re-validated in `/release`; the client only ever renders/scans the value, never decodes it into a trusted payload. It is impossible to forge a valid tag without the `CLAIMIT_QR_SECRET` function secret, and each minted tag is unique (distinct item ids + the partial unique index on `items.qr_code`). Legacy `FND-XXXXX` tags from Phase 4 seeds remain valid exact-match lookups but no new tag is minted that way; a tampered token fails Step 2 via the stored-match gate (and, for signed-format tags, the HMAC check). Function secret required: `CLAIMIT_QR_SECRET` (mint helpers fail closed when unset).

No other endpoint, UI action, or admin panel is permitted to set `items.status = 'claimed'`. This is enforced both by API design (no other route accepts that mutation) and by Postgres RLS policies restricting UPDATE on `items.status` to that function's service role.

### Supporting endpoint — create a found item (Staff Logging)

```
POST /api/log-found
body: { title, category, description, found_location, found_date? }
```

Runs as the service role. Verifies an authenticated **staff** session (same Supabase-token check as `/release`), inserts the item with `source = 'staff_logged'`, `status = 'available'`, `confirmed_by`/`confirmed_at` set, mints the signed QR token over the resulting item id and stores it in `qr_code` (shared `_shared/claimit.ts` mint), then writes a `found` audit_log row. It never touches `claimed`; the non-negotiable release path above still owns that transition.

### Supporting endpoint — confirm receipt (staff, student-reported items)

```
POST /confirm-receipt
body: { itemId }
```

Also runs as the service role with the same staff auth contract. It loads the item and confirms exactly once: the item must be `source = 'student_reported'` **and** `status = 'pending_dropoff'` (anything else → `409`), then mints the signed QR token over the item id (same shared generation path as `/log-found`), transitions the item `pending_dropoff → available` with `confirmed_by`/`confirmed_at`, and writes a `confirmed` audit_log row. This is only legal inbound order to give a student-reported item a QR (CP-03/CP-04); `claimed` still belongs exclusively to `/release`.

**Shared Edge Function module:** `/log-found`, `/confirm-receipt`, and `/release` all import `supabase/functions/_shared/claimit.ts` (CORS, JSON helpers, `signedQrToken`/`isSignedQrValid` HMAC mint+verify, `requireStaffUser` staff check that decodes the caller's Supabase access-token `sub` against the users table) so the staff paths share one implementation (09 §9 — "don't duplicate this logic, share it"). `_shared` is bundled into each function at deploy time.

## 5. Screen-to-module map

| Screen                       | Module            | Writes to                                                                          |
| ---------------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| Report Lost Item             | Student Report    | `lost_reports`                                                                     |
| Report Found Item            | Student Report    | `items` (status: pending_dropoff)                                                  |
| Log Found Item (staff)       | Staff Logging     | `items` (status: available, qr generated)                                          |
| Confirm Receipt              | Staff Logging     | `items` (status: pending_dropoff → available, qr generated via `/confirm-receipt`) |
| Possible Matches / Home feed | Matching          | reads `items` + `lost_reports`, writes `claims` on "This is mine"                  |
| Claim Verification           | Matching          | `claims` (status: pending)                                                         |
| Scan QR to Release           | QR Release        | `items.status` via `/release`, `audit_log` (`released`), `claims` (staff approval) |
| Audit Log                    | Audit & Reporting | reads `audit_log`                                                                  |
| Staff Dashboard              | Operation home    | reads `items` + `claims`; writes none (Log Found = separate screen)                |

**Staff Dashboard summary counts (decided window):** the three cards show a **"This week"** count — the trailing 7 days from now, keyed on `created_at` (`now - created_at <= 7 days`), computed client-side over the already-fetched lists. The tab lists themselves are intentionally not windowed. The floating "+" opens Log Found Item; Scan QR to Release is reachable directly from the staff bottom nav.

**Claim transition (Phase 7):** filing a claim writes a `claims` row with `status = 'pending'`; its `claim_requested` audit row is auto-created by a SECURITY DEFINER trigger (migration `20250924000006_phase10_audit_auto.sql`) — the client never writes `audit_log` directly, since RLS denies students any INSERT there. A server-side trigger (migration `20250924000005_phase7_claims.sql`) then moves the referenced item `available → pending_claim` — and only from `available`; `pending_dropoff` (unconfirmed) items stay put, and the trigger can never write `claimed` (that stays exclusive to `/release`, enforced by the `items_status_lock` trigger). A partial unique index also rejects a second _pending_ claim on the same item. Staff read pending claims (with claimant name + item) via RLS-staff policies — no Edge Function required.

**Claim decisioning (Phase 9):** the staff approval decision lands on the Release bottom sheet, where staff compare the physical item against the claim's verification answer. Approving sets `claims.status = 'approved'` via the staff RLS policy (`claims_update_staff`) — approval alone never changes item status. Release then additionally requires a live QR scan whose value matches the item (`/release` step 2) and the approved claim (`/release` step 3, else `409 claim_not_approved` — CP-06). Item rows and their claims are read client-side under staff RLS; only the release mutation itself needs the Edge Function.

## 6. Matching logic (v1)

Rule-based, not AI-based, per scope constraints:

- Category exact match (required)
- Keyword overlap between `lost_reports.description` and `items.description` (simple text similarity, e.g. trigram or ILIKE)
- Location proximity (same building/area string match, or a curated location taxonomy)
- Date window (found_date within N days of lost_date)

A match above a threshold triggers a push notification; all found items remain independently browsable regardless of match score.

**Implemented (Phase 6):** matching runs server-side as a SQL RPC, `find_possible_matches(report_id) → setof items` (migration `20250924000004_phase6_matching.sql`). v1 gates: item `status <> 'claimed'`, exact category (case-insensitive), `found_date` within **14 days** of `lost_date`; signal: at least one description keyword of length ≥ 4 shared **or** location proximity (one location string contains the other). The scan is invoked by the `POST /match` Edge Function (owner or staff/admin-gated, same auth contract as `/log-found`), which sets `lost_reports.status = 'possible_match'`, writes one `matched` audit row per matching item (only on the `searching → possible_match` transition, keeping reruns idempotent), then best-effort sends an Expo push to the reporter's `users.push_token`. Notifications are never a gate: a missing/invalid push token degrades to the in-app UI states. The client registers its token on sign-in through `src/lib/push.ts` + `usePushTokenSync` (RLS limits the write to the user's own row's `push_token` column via a column grant, migration 04), and the student feed triggers `POST /match` immediately after filing a lost report.

## 7. Notifications

Expo push token stored per user on login. Triggered server-side (Edge Function) when:

- A new/confirmed found item scores above the match threshold against an open lost report.

## 8. Build & deploy

- EAS Build (Android profile) for APK output.
- Environment variables (Supabase URL/anon key, Clerk publishable key) via `.env` + `app.config.js`, never committed.
