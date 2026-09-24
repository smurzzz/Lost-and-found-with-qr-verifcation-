# ClaimIt — Architecture

## 1. System overview

```
┌─────────────────────┐        ┌─────────────────────┐
│   Expo / React       │  HTTPS │   Supabase           │
│   Native App          │◄──────►│  - Postgres DB       │
│   (Android)           │        │  - Storage (photos)  │
│                       │        │  - Edge Functions    │
└──────────┬────────────┘        └───────────┬──────────┘
           │                                  │
           │ Auth (SSO)                       │ Push
           ▼                                  ▼
     ┌───────────┐                    ┌───────────────┐
     │  Clerk    │                    │ Expo Push API │
     └───────────┘                    └───────────────┘
```

## 2. Layers

- **Presentation** — Expo Router screens, organized by role (`/app/(student)/...`, `/app/(staff)/...`).
- **State/data** — React Query (or SWR) for server state; local component state for forms.
- **API** — Supabase Edge Functions / Postgres RPC for anything that mutates status (especially release), so the "staff-scan-only" rule lives server-side, not in a client screen.
- **Data** — Postgres tables via Supabase, Row-Level Security (RLS) enforcing role-based access.

## 3. Data model (minimum viable schema)

**users**

| column        | type                        | notes                            |
| ------------- | --------------------------- | -------------------------------- |
| id            | uuid                        | Clerk user id                    |
| role          | enum(student, staff, admin) |                                  |
| name          | text                        |                                  |
| email         | text                        | school domain enforced at signup |
| class_or_dept | text                        | optional                         |

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

## 4. The non-negotiable constraint

Item status can only transition to `claimed` through a single server-side endpoint:

```
POST /api/items/:id/release
body: { claimId, scannedQrCode, staffId }
```

This endpoint:

1. Verifies the caller has an authenticated **staff** session.
2. Verifies `scannedQrCode` matches the item's stored `qr_code`.
3. Verifies the referenced `claimId` is `approved`.
4. Writes the `released` audit_log row.
5. Only then updates `items.status = 'claimed'`.

No other endpoint, UI action, or admin panel is permitted to set `items.status = 'claimed'`. This is enforced both by API design (no other route accepts that mutation) and by Postgres RLS policies restricting UPDATE on `items.status` to that function's service role.

### Supporting endpoint — create a found item (Staff Logging)

```
POST /api/log-found
body: { title, category, description, found_location, found_date? }
```

Runs as the service role. Verifies an authenticated **staff** session (same Clerk-JWT check as `/release`), mints a unique `FND-xxxxx` QR tag server-side (backed by a partial unique index on `items.qr_code`), inserts the item with `source = 'staff_logged'`, `status = 'available'`, `confirmed_by`/`confirmed_at` set, then writes a `found` audit_log row. It never touches `claimed`; the non-negotiable release path above still owns that transition.

## 5. Screen-to-module map

| Screen                       | Module            | Writes to                                                         |
| ---------------------------- | ----------------- | ----------------------------------------------------------------- |
| Report Lost Item             | Student Report    | `lost_reports`                                                    |
| Report Found Item            | Student Report    | `items` (status: pending_dropoff)                                 |
| Log Found Item (staff)       | Staff Logging     | `items` (status: available, qr generated)                         |
| Confirm Receipt              | Staff Logging     | `items` (status: pending_dropoff → available, qr generated)       |
| Possible Matches / Home feed | Matching          | reads `items` + `lost_reports`, writes `claims` on "This is mine" |
| Claim Verification           | Matching          | `claims` (status: pending)                                        |
| Scan QR to Release           | QR Release        | `items.status`, `audit_log`                                       |
| Audit Log                    | Audit & Reporting | reads `audit_log`                                                 |

**Claim transition (Phase 7):** filing a claim writes a `claims` row with `status = 'pending'` plus a `claim_requested` audit row (RLS-guarded `insertClaim`). A server-side trigger (migration `20250924000005_phase7_claims.sql`) then moves the referenced item `available → pending_claim` — and only from `available`; `pending_dropoff` (unconfirmed) items stay put, and the trigger can never write `claimed` (that stays exclusive to `/items/:id/release`, enforced by the `items_status_lock` trigger). A partial unique index also rejects a second _pending_ claim on the same item. Staff read pending claims (with claimant name + item) via RLS-staff policies — no Edge Function required.

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
