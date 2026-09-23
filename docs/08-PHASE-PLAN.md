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

- [ ] Log Found Item form writes to `items`, QR generated server-side immediately
- [ ] QR Tag Ready screen displays the real generated QR
- [ ] Staff Found Items list fetches real data, replacing the Phase 1 mock

**Exit criterion:** staff can log a real item and get a scannable QR end to end.

---

## Phase 5 — Student Reporting (wire the real thing)

- [ ] Report Lost Item writes to `lost_reports`
- [ ] Report Found Item writes to `items` with `pending_dropoff`, no QR yet
- [ ] My Lost Reports list fetches real data

**Exit criterion:** CP-03 passes — a student-reported item has no QR until staff acts.

---

## Phase 6 — Shared Feed & Matching (wire the real thing)

- [ ] Student Home feed fetches real combined items (staff-logged + student-reported)
- [ ] Category filter + search hit real data
- [ ] Mine / Not mine wired to real claim creation / local dismissal
- [ ] Matching logic implemented server-side; push notification sent on probable match

**Exit criterion:** a lost report seeded in Phase 2's test data correctly surfaces a real notification against a matching item.

---

## Phase 7 — Claims (wire the real thing)

- [ ] Claim Verification writes to `claims`
- [ ] Staff Pending Claims tab fetches real pending claims

**Exit criterion:** CP-06 passes — a claim must exist and be approved before release is possible.

---

## Phase 8 — Confirm Receipt (wire the real thing)

- [ ] Staff Student Reports tab fetches real `pending_dropoff` items
- [ ] Confirm Receipt screen writes the real status transition and generates the QR

**Exit criterion:** CP-04 passes.

---

## Phase 9 — QR Release (core feature, wire the real thing)

**This is the phase the whole project depends on — allocate the most review time here.**

- [ ] Real camera scanning replaces the Phase 1 debug-button mock
- [ ] Scan validated server-side against the signed QR token
- [ ] Confirm Release bottom sheet pulls real claimant/claim data
- [ ] Release endpoint fully wired end to end
- [ ] Item Released success state reflects the real server response

**Exit criterion:** CP-05 and CP-07 pass — invalid scans are rejected, and every transition produces an audit_log row.

---

## Phase 10 — Audit & Reporting (wire the real thing)

- [ ] Audit log list + filters fetch real `audit_log` data
- [ ] Expandable per-item timeline reads real chronological events

**Exit criterion:** AL-01 through AL-03 pass.

---

## Phase 11 — Polish, Test, Submit

- [ ] Full pass through `05-TESTING-REPORT.md`
- [ ] EAS Build → Android APK
- [ ] Demo rehearsal against `04-DEMO-GUIDE.md`
- [ ] Final documentation review

**Exit criterion:** installable APK, all critical-path tests ✅, demo runs start to finish without improvisation.
