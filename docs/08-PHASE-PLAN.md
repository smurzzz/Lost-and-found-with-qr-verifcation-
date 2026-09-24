# ClaimIt — Phase Plan

Sequential build plan: **Phase 0 sets up the environment, Phase 1 builds every screen in the app with static/mock data (no backend), and every phase after that wires up the backend module by module.** This order lets you demo the full click-through experience early, then make it real underneath.

Each phase has a goal, tasks, and an exit criterion — don't start the next phase until the current one's exit criterion is met.

---

## Phase 0 — Environment & Installation

**Goal:** a clean machine can go from nothing to a running (empty) app talking to real backend services.

### 0.1 Local tooling

- [ ] Install Node.js LTS (check `.nvmrc` if present; otherwise latest LTS)
- [ ] Install a package manager (npm, yarn, or pnpm — pick one and stay consistent across the team)
- [ ] Install Expo CLI (`npx expo` is sufficient; no global install required)
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Install Git, configure user name/email
- [ ] Install Android Studio (for emulator) or set up a physical Android device with USB debugging / Expo Go

### 0.2 Project scaffold

- [ ] `npx create-expo-app claimit --template` (TypeScript template)
- [ ] Initialize `expo-router` navigation structure
- [ ] Initialize git repo, add `.gitignore` (must include `.env`, `node_modules`, `.expo`, build artifacts)
- [ ] Push empty scaffold to remote repo

### 0.3 Install dependencies

Install the full dependency set from `06-LIBRARY-DOCS.md`:

```
npx expo install expo-router expo-camera expo-barcode-scanner expo-notifications expo-image-picker
npm install @clerk/clerk-expo @supabase/supabase-js @tanstack/react-query react-hook-form zod
npm install -D eslint prettier husky lint-staged typescript
```

- [ ] Confirm versions pinned per the policy in `06-LIBRARY-DOCS.md` (exact versions for `expo`, `@clerk/clerk-expo`, `@supabase/supabase-js`)

### 0.4 External services

- [ ] Create Supabase project; note project URL and anon key
- [ ] Create Clerk project; configure SSO provider; set student email-domain allowlist; note publishable key
- [ ] Create EAS project (`eas init`), link to Expo account

### 0.5 Environment variables

- [ ] Create `.env` (never committed) with:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

- [ ] Wire `.env` into `app.config.js` / `app.config.ts` `extra` field so Expo picks it up
- [ ] Set Supabase **service-role** key as a Supabase Edge Function secret only — never in the app's `.env`
- [ ] Create `.env.example` (committed) with the same keys, empty values, so teammates know what to fill in

### 0.6 Dev tooling

- [ ] Configure ESLint + Prettier per `03-CODE-STANDARDS.md`
- [ ] Set up Husky pre-commit hook running lint-staged
- [ ] Confirm `tsconfig.json` has `"strict": true`

### 0.7 Verify

- [ ] `npx expo start` runs without error
- [ ] App loads on emulator/device, shows default screen
- [ ] A trivial Supabase query succeeds (e.g., fetch an empty `items` table) — confirms env vars wired correctly
- [ ] A Clerk sign-in screen renders — confirms auth wiring

**Exit criterion:** empty app runs, connects to Supabase, connects to Clerk, and the repo is pushed with working CI-lint on a PR.

---

## Phase 1 — All UI Screens (static, no backend)

**Goal:** every screen in the app exists, is navigable, and looks correct — built entirely against hardcoded/mock data. Nothing in this phase touches Supabase or Clerk beyond the login screen's shell. The point is a fully click-through prototype before any backend logic exists.

### 1.1 Design system & shared components

- [ ] Implement color tokens, typography, spacing per the design brief
- [ ] Build shared components: `Card`, `StatusBadge`, `Button` (primary/accent/outline/text variants), `Chip`, `SearchBar`, `BottomNav`, `FAB`
- [ ] Set up mock data fixtures (`/mocks/items.ts`, `/mocks/claims.ts`, `/mocks/users.ts`, `/mocks/auditLog.ts`) that every screen below reads from instead of a real API

### 1.2 Student screens (static)

- [ ] Login / Onboarding (UI only — "Continue with SSO" navigates straight to Student Home, no real auth yet)
- [ ] Student Home — feed rendered from mock items, category chips filter client-side, Mine/Not mine buttons present but only navigate/toggle local state
- [ ] Report Lost Item — form renders, validates, "Submit" just navigates back (no write)
- [ ] Report Found Item — same, including the "Pending drop-off" confirmation state
- [ ] Possible Matches — rendered from a mock matched subset
- [ ] Claim Verification — form renders, "Submit Claim" shows the confirmation state
- [ ] Profile — static account info

### 1.3 Staff screens (static)

- [ ] Staff Dashboard — three tabs (Found Items / Pending Claims / Student Reports) rendered from mock data
- [ ] Log Found Item — form renders, submit navigates to a mock QR Tag screen
- [ ] Confirm Receipt — renders a mock pending item, both buttons just navigate
- [ ] Receipt Confirmed / QR Tag — static QR placeholder + item details
- [ ] Scan QR Tag — camera preview UI (permission prompt can be real; the "scan result" is a mock triggered by a debug button, since there's no real QR yet)
- [ ] Audit Log — static timeline rendered from a mock item's history

### 1.4 Navigation & polish pass

- [ ] Every screen reachable from bottom nav / FAB / card taps in both role flows
- [ ] Empty states and loading-skeleton visuals built (even though there's no real async fetch yet, build the UI for these states now so Phase 2+ just has to trigger them)
- [ ] Responsive check on at least one small and one large Android screen size

**Exit criterion:** a reviewer can tap through the entire app — both roles, every screen — and it looks and navigates exactly like the final product, using only mock data. No screen is missing, no button dead-ends.

---

## Phase 2 — Data Layer & Schema

**Goal:** the database matches `02-ARCHITECTURE.md` §3 exactly, with RLS policies enforcing the core constraint, before any screen is wired to it.

- [ ] Create tables: `users`, `items`, `lost_reports`, `claims`, `audit_log`
- [ ] Set up RLS: students can read/write their own reports and claims; staff can read/write items and confirm receipt; **only the release Edge Function's service role can set `items.status = 'claimed'`**
- [ ] Write the `/api/items/:id/release` Edge Function per the contract in `02-ARCHITECTURE.md` §4
- [ ] Seed a small test dataset (a few items, a lost report, a staff and student test user)

**Exit criterion:** CP-01 and CP-02 from `05-TESTING-REPORT.md` pass — no path other than the release function can set an item to `claimed`.

---

## Phase 3 — Auth & Roles (wire the real thing)

- [ ] Replace the mock "Continue with SSO" with real Clerk SSO
- [ ] Student self-signup flow (domain-restricted), create `users` row on first login
- [ ] Staff invite-only provisioning
- [ ] Role-based route guarding in `expo-router` (replace the Phase 1 static navigation with real role checks)
- [ ] Profile screen reads real session data

**Exit criterion:** a student and a staff account can each log in for real and land on their correct role's home screen; a student cannot access any staff route.

---

## Phase 4 — Staff Logging (wire the real thing)

- [x] Log Found Item form writes to `items`, QR generated server-side immediately
- [x] QR Tag Ready screen displays the real generated QR
- [x] Staff Found Items list fetches real data, replacing the Phase 1 mock

Implemented: `log-found` Edge Function (staff-only, mints `FND-xxxxx`, inserts item `source=staff_logged`/`status=available`, writes `found` audit row), `react-native-qrcode-svg` for real scannable QRs, `/lib/api` + `/lib/hooks` React Query wiring, controlled + validated Log Found form, and a DB-driven Found Items list (demo mode keeps the Phase 1 mocks). Dependency & schema changes: `react-native-qrcode-svg` (see LIBRARY-DOCS), migration `20250924000003_phase4_qr_unique.sql`.

**Exit criterion:** staff can log a real item and get a scannable QR end to end — code-complete; close the ⏳ in `05-TESTING-REPORT.md` SL-01 with a live run (blocked only by the Phase 3 dashboard config steps).

---

## Phase 5 — Student Reporting (wire the real thing)

- [x] Report Lost Item writes to `lost_reports`
- [x] Report Found Item writes to `items` with `pending_dropoff`, no QR yet
- [x] My Lost Reports list fetches real data

Implemented: `ReportLostScreen`/`ReportFoundScreen` submit through `/lib/hooks` (React Query) into the RLS-guarded `insertLostReport` / `insertStudentFoundItem` helpers; the shared `ReportForm` gained an "Item name" field for Found reports (the `items.title` column is NOT NULL — the Phase 1 mock didn't need one), a `busy`/`submitError` state, and a typed `onSubmit(values)` callback. The student home's "My Lost Reports" section now renders real rows via `LostReportCard` (status-aware pill), with demo-mode fallback to the mock card. The student-reported item keeps `status = pending_dropoff`, `qr_code = NULL` — QR is only minted server-side when staff confirm (CP-03), and its `reported` audit row is auto-created by a SECURITY DEFINER trigger (migration `20250924000006_phase10_audit_auto.sql`), since students hold no `audit_log` INSERT rights.

**Exit criterion:** CP-03 passes — a student-reported item has no QR until staff acts. Code-complete; live-verify against the migration `20250924000000_phase2_schema.sql` default + RLS student-insert policy (SR-01/02/03 in `05-TESTING-REPORT.md`).

---

## Phase 6 — Shared Feed & Matching (wire the real thing)

- [x] Student Home feed fetches real combined items (staff-logged + student-reported)
- [x] Category filter + search hit real data
- [x] Mine / Not mine wired to real claim creation / local dismissal
- [x] Matching logic implemented server-side; push notification sent on probable match

Implemented: the home feed (and the shared Search tab) now render real `items` rows via `useFoundItems` through `Feed`'s new `dbItems`/`dbLoading` mode — search and category chips filter live data, `claimed` items are hidden, and "Not mine" dismisses locally (phase-agnostic). Cards use the new `StudentItemCard`; tapping **Mine** routes to `claim-verify` with the real `itemId` param, where the live `ItemRow` is resolved via `useItem` (the claim INSERT itself is Phase 7). Matching is server-side: `find_possible_matches(report_id)` (migration `20250924000004_phase6_matching.sql` — category exact + 14-day window + description-keyword overlap OR location proximity) is run by the new `/match` Edge Function (owner or staff-gated), which flips the report to `possible_match` + writes `matched` audit rows once, then best-effort pushes an Expo notification to `users.push_token`. The client registers its token (`src/lib/push.ts` + `usePushTokenSync`) and `report-lost` triggers `/match` right after filing a report.

**Exit criterion:** the Phase 2 seeded lost report (Electronics headphones, Student Center) matches the White headphones item via category + keyword overlap — verified by calling `/match` for report `20000000-0000-4000-8000-000000000001` with Alex's device push token registered. That surfaces a real notification (see live steps in `07-PROGRESS-TRACKER.md`).

---

## Phase 7 — Claims (wire the real thing)

- [x] Claim Verification writes to `claims`
- [x] Staff Pending Claims tab fetches real pending claims

Implemented: **Claim Verification** now submits a real claim — `useClaimItem` → RLS-guarded `insertClaim` (claim `pending`; its `claim_requested` audit row is auto-created by the `claims_requested_audit_trigger` in migration `20250924000006_phase10_audit_auto.sql` — students hold no `audit_log` INSERT rights), and migration `20250924000005_phase7_claims.sql` adds a server-side trigger that moves the item `available → pending_claim` (never `claimed`, and never touching unconfirmed `pending_dropoff` items) plus a partial unique index enforcing one _pending_ claim per item. The submit button validates the distinctive-detail field, shows busy/error states, and routes to claim-success on success. The **Staff Pending Claims tab** fetches real `pending` claims joined with the claimant name and item details via `usePendingClaims` → `fetchPendingClaims` (RLS lets staff read all claims/users/items, so no Edge Function is needed), with loading/error/retry/empty states and the stat card wired to the live count; demo mode keeps the mock list.

**Exit criterion:** CP-06 passes — a claim must exist and be approved before release is possible. With Phase 7, claims rows are real (status `pending`), the item reflects `pending_claim`, and staff see them in the tab; the _approved_ decision + release gate still land in Phase 9.

---

## Phase 8 — Confirm Receipt (wire the real thing)

- [x] Staff Student Reports tab fetches real `pending_dropoff` items
- [x] Confirm Receipt screen writes the real status transition and generates the QR

Implemented: the staff `Student Reports` tab reads real `pending_dropoff` items via `useStudentReports` → `fetchStudentReports` (loading/error/retry/empty states, live stat count, card → `confirm-receipt?itemId=`). Confirm Receipt resolves the item by id, requires the "details match" checkbox, and confirms through the new `/confirm-receipt` Edge Function: staff-gated (same auth contract as `/log-found`), preconditioned on `source = 'student_reported'` **and** `status = 'pending_dropoff'` (confirms exactly once — a second attempt or a non-pending item gets `409`), mints the server-side `FND-xxxxx` QR through the shared `supabase/functions/_shared/claimit.ts` helpers (CORS/json/fail, QR minting, `requireStaffUser` — `log-found` now imports the same module per 09 §9 "share, don't duplicate"), transitions the item `pending_dropoff → available` with `confirmed_by`/`confirmed_at`, writes a `confirmed` audit row, and routes to `qr-tag?itemId=` (the real scannable QR). The old client-side RLS `confirmReceipt` helper was removed (no callers; it would have minted the QR on-device). No schema migration was needed.

**Exit criterion:** CP-04 passes — `qr_code` stays null until a staff confirm, then it's populated and the item becomes `available`. Live steps: `supabase functions deploy _shared confirm-receipt log-found` (shared module is bundled at deploy), then confirm a seeded student-reported item from the dashboard.

---

## Phase 9 — QR Release (core feature, wire the real thing)

**This is the phase the whole project depends on — allocate the most review time here.**

- [x] Real camera scanning replaces the Phase 1 debug-button mock
- [x] Scan validated server-side against the signed QR token
- [x] Confirm Release bottom sheet pulls real claimant/claim data
- [x] Release endpoint fully wired end to end
- [x] Item Released success state reflects the real server response

**Exit criterion:** CP-05 and CP-07 pass — invalid scans are rejected, and every transition produces an audit_log row.

Implemented: `scan.tsx` uses expo-camera `CameraView` QR barcode scanning (permission + denial-recovery panels, invalid-tag and network error states with a rescan path) and resolves the tag against the DB (`fetchItemByQrCode`) before opening the release sheet; the `release` Edge Function was rewritten to take `itemId` in the request body (Supabase invokes the function at `/functions/v1/release`, so the old `/items/:id/release` path could never be reached from the client — the body form is the actual wire fix) and keeps the §4 steps: staff auth → scanned QR matches item → claim `approved` (else 409 `claim_not_approved`, CP-06) → `released` audit row → `items.status='claimed'` last; `releaseItem`/`useReleaseItem` route the Confirm Release through it; `release.tsx` pulls the item + claims for real (`useItem` + `useClaimsForItem`), approves pending claims via RLS (`useApproveClaim`), blocks release with no approved claim (CP-06) and shows a read-only state for already-claimed items, then routes to `released.tsx`, which now reflects the real item + claim id. `expo-camera@~57.0.5` was already installed; no migration needed.

---

## Phase 10 — Audit & Reporting (wire the real thing)

- [x] Audit log list + filters fetch real `audit_log` data
- [x] Expandable per-item timeline reads real chronological events

**Exit criterion:** AL-01 through AL-03 pass.

Implemented: `useAuditFeed` → `fetchAuditFeed` reads the append-only `audit_log` with item + actor joins (`audit_log_item_id_fkey` / `audit_log_actor_id_fkey`; any authenticated user can read per the `audit_log_select` RLS policy — no Edge Function needed) and groups events per item (chronological within an item, newest group first). `audit.tsx` real mode keeps the Phase 1 filter chips (All / Unclaimed / Pending Claim / Claimed, mapped to item statuses) and the same expandable timeline visual, but each step now shows the real event label (`reported/confirmed/found/matched/claim_requested/released`), the actor's name + role (or `System` for trigger/system writes), timestamp, and the event note (e.g. the released handoff's claim id). Loading, error+retry, and empty states are explicit; demo mode keeps the mocks. Student-originated audit rows (`reported` on a student-found item, `claim_requested` on claim filing) are auto-created by SECURITY DEFINER triggers — migration `20250924000006_phase10_audit_auto.sql` — rather than attempted client-side, which RLS would deny (students hold no `audit_log` INSERT rights); the old client-side write in `insertClaim` was removed.

---

## Phase 11 — Polish, Test, Submit

- [ ] Full pass through `05-TESTING-REPORT.md`
- [ ] EAS Build → Android APK
- [ ] Demo rehearsal against `04-DEMO-GUIDE.md`
- [ ] Final documentation review

**Exit criterion:** installable APK, all critical-path tests ✅, demo runs start to finish without improvisation.
