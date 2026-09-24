# ClaimIt — Progress Tracker

> Update status per task as work happens. Status legend: 🔲 Not started · 🟡 In progress · ✅ Done · 🔴 Blocked

## Milestone 1 — Foundations

| Task                                                  | Owner    | Status | Notes                                                                                  |
| ----------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------------------------- |
| Repo scaffolded (Expo + TypeScript + Router)          | Codebuff | ✅     | Phase 0 done — project root on Expo SDK 57, strict TS, expo-router; committed          |
| Supabase project created, schema migrated             |          | 🔲     | wiring ready (`src/lib/supabase.ts`); needs real project URL/anon key in `.env` (0.4)  |
| Clerk project set up, domain allowlist configured     |          | 🔲     | wiring ready (`ClerkProvider` in `_layout.tsx`); needs publishable key in `.env` (0.4) |
| Design system tokens implemented (colors, typography) | Codebuff | ✅     | Phase 1 — mockup palette + Plus Jakarta Sans / DM Sans via `@expo-google-fonts`        |
| Navigation shell (student + staff route groups)       | Codebuff | ✅     | Phase 1 — `(student)` + `(staff)` groups, student/staff bottom navs, all 13 screens    |

## Phase 1 — UI Screens (all 13, static with mock data)

| Screen                | Flow    | Status | Notes                                                                                                                                   |
| --------------------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 01 Login              | Student | ✅     | SSO button → student home; demo staff sign-in → dashboard                                                                               |
| 02 Student Home       | Student | ✅     | live search + category filters, local item photos, dismissal; redesigned to v3 mockup (navy/blue/orange, #EEF1F8 bg, compact Mine-card) |
| 03 Report Lost Item   | Student | ✅     | validated form, category/date sheets, image picker                                                                                      |
| 04 Report Found Item  | Student | ✅     | pending drop-off notice + confirmation state                                                                                            |
| 05 Possible Matches   | Student | ✅     | real match cards, dismiss, empty state                                                                                                  |
| 06 Claim Verification | Student | ✅     | passes tapped item, char counter, claim confirmation                                                                                    |
| 07 Staff Dashboard    | Staff   | ✅     | summary cards, 3 working tabs, staff cards, log-found CTA                                                                               |
| 08 Log Found Item     | Staff   | ✅     | validated intake form → generates CI-XXXXXX tag                                                                                         |
| 09 Confirm Receipt    | Staff   | ✅     | resolves tapped report/item, generates tag on confirm                                                                                   |
| 10 QR Tag Ready       | Staff   | ✅     | tag card + QR grid; mock print; shared `lib/qr-tag`                                                                                     |
| 11 Scan to Release    | Staff   | ✅     | animated viewfinder; camera simulated until Phase 6                                                                                     |
| 12 Audit Log          | Staff   | ✅     | lifecycle timeline with working stage filters                                                                                           |
| 13 Profile            | Both    | ✅     | shared `ProfileView`, per-role identity + nav, mock logout                                                                              |

## Milestone 2 — Auth & Roles (Phase 3)

| Task                                         | Owner | Status | Notes                                                                                                                                                                                                           |
| -------------------------------------------- | ----- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Student self-signup (SSO, domain-restricted) |       | 🟡     | Real Clerk SSO wired (`startSSOFlow` + `setActive`), `users_insert_self` policy (role forced to `student`), domain check in `sync-user.ts`. Awaiting Supabase JWT-issuer config + live run to mark done         |
| Staff invite-only provisioning flow          |       | 🟡     | `syncUserOnLogin` throws `StaffNotProvisionedError` for staff emails without a pre-existing row; provisioning is a service-role SQL insert of the staff row (never self-created) — SQL snippet in blocker notes |
| Role-based route guarding                    |       | ✅     | `RoleGuard` wraps `(student)` + `(staff)` layouts; session-aware `index.tsx`; wrong-role → correct home, logged-out → `/login`                                                                                  |
| Profile screen                               |       | ✅     | Student + staff profiles read the real session (name/initials/role via `useSession`), real `signOut()`; role-toggle previews are demo-mode only                                                                 |

## Milestone 3 — Staff Logging

| Task                          | Owner | Status | Notes |
| ----------------------------- | ----- | ------ | ----- |
| Log Found Item form           |       | 🔲     |       |
| QR generation on submit       |       | 🔲     |       |
| QR Tag Ready screen + print   |       | 🔲     |       |
| Found Items list (staff view) |       | 🔲     |       |

## Milestone 4 — Student Reporting

| Task                              | Owner | Status | Notes |
| --------------------------------- | ----- | ------ | ----- |
| Report Lost Item form             |       | 🔲     |       |
| Report Found Item form            |       | 🔲     |       |
| "Pending drop-off" status + badge |       | 🔲     |       |
| My Lost Reports list              |       | 🔲     |       |

## Milestone 5 — Shared Found Feed & Matching

| Task                                              | Owner | Status | Notes                                    |
| ------------------------------------------------- | ----- | ------ | ---------------------------------------- |
| Unified scrollable Found Items feed               |       | 🔲     | staff-logged + student-reported combined |
| Category filter + search                          |       | 🔲     |                                          |
| Mine / Not mine actions on feed cards             |       | 🔲     |                                          |
| Matching logic (category + keyword + date window) |       | 🔲     |                                          |
| Push notification on probable match               |       | 🔲     |                                          |
| Possible Matches screen                           |       | 🔲     |                                          |

## Milestone 6 — Claims

| Task                               | Owner | Status | Notes |
| ---------------------------------- | ----- | ------ | ----- |
| Claim Verification screen          |       | 🔲     |       |
| Claim submitted confirmation state |       | 🔲     |       |
| Staff Pending Claims tab           |       | 🔲     |       |

## Milestone 7 — Staff Confirm Receipt (student-reported items)

| Task                              | Owner | Status | Notes                                    |
| --------------------------------- | ----- | ------ | ---------------------------------------- |
| Staff Student Reports tab         |       | 🔲     |                                          |
| Confirm Receipt screen            |       | 🔲     |                                          |
| QR generated only on confirmation |       | 🔲     | core constraint — see ARCHITECTURE.md §4 |

## Milestone 8 — QR Release (core feature)

| Task                                               | Owner | Status | Notes                                             |
| -------------------------------------------------- | ----- | ------ | ------------------------------------------------- |
| Camera scanning screen                             |       | 🔲     |                                                   |
| Scan validation against item record                |       | 🔲     |                                                   |
| Confirm Release bottom sheet                       |       | 🔲     |                                                   |
| `/api/items/:id/release` endpoint, server-enforced |       | 🔲     | critical path — see TESTING-REPORT.md CP-01–CP-07 |
| Item Released success state                        |       | 🔲     |                                                   |

## Milestone 9 — Audit & Reporting

| Task                                         | Owner | Status | Notes |
| -------------------------------------------- | ----- | ------ | ----- |
| Audit log list + status filters              |       | 🔲     |       |
| Expandable per-item timeline                 |       | 🔲     |       |
| Audit entry auto-created on every transition |       | 🔲     |       |

## Milestone 10 — Polish & Submission

| Task                         | Owner | Status | Notes             |
| ---------------------------- | ----- | ------ | ----------------- |
| Full critical-path test pass |       | 🔲     | TESTING-REPORT.md |
| EAS Build (Android APK)      |       | 🔲     |                   |
| Demo rehearsal               |       | 🔲     | DEMO-GUIDE.md     |
| Documentation finalized      |       | 🔲     | this folder       |

## Blockers / open questions

| Date raised | Blocker                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Owner   | Resolution                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| 2026-09-24  | Real auth is code-complete but the live bridge needs two dashboard steps that can't be done from the repo: (1) **Supabase** → Auth → JWT Settings → add Clerk as a custom JWT issuer (JWKS URL) so `auth.uid()`/`auth.role()` resolve from the Clerk session JWT; (2) **Clerk** → JWT Templates → a `supabase` template whose `sub` is `{{user.id}}`. Until both exist, `applyClerkSupabaseToken` stores a token Supabase won't accept → sync errors surface on login. | (human) | Repeat steps in `mobile-jwt-issuer` note / Clerk docs; tick `05-TESTING-REPORT.md` AUTH-01 |
| 2026-09-24  | Staff provisioning is invite-only by design (AGENTS one-rule-safe: staff rows are never self-created). To onboard a real staff tester, run a **service-role** insert: `insert into users (id, role, name, email) values ('<clerk_user_id>', 'staff', 'Maya Chen', 'mayac@school.edu') on conflict (id) do update set role = 'staff';` (Clerk id looks like `user_2…` — `users.id` is now `text`).                                                                      | (human) | Migrate `20250924000002_phase3_auth.sql` must be pushed first (`supabase db push`)         |

## Weekly log

| Week of    | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Next steps                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-22 | Phase 0 (0.1–0.3, 0.5–0.7) complete on Expo SDK 57: tooling verified, project root scaffolded, deps installed, ESLint/Prettier/husky set up, `.env`/`.env.example`/`app.config.ts` wired, expo-doctor 21/21, Android bundle exports, dev server verified, committed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 0.4: create Supabase + Clerk projects with real keys → fill `.env`; set up EAS project (`eas init`); push repo to remote; then Phase 1 |
| 2026-09-23 | Phase 1 (all 13 UI screens) complete with mock data: design system (tokens, fonts, shared components), student flow (login → home → report lost/found → matches → claim), staff flow (dashboard → log found → confirm receipt → QR tag → scan → audit), shared profile; every screen tsc/ESLint-clean and interaction-verified live; committed per screen                                                                                                                                                                                                                                                                                                                                                                                                                                   | Phase 2+ : real auth (0.4 keys), data layer, camera scanning, matching engine per 08-PHASE-PLAN.md                                     |
| 2026-09-24 | Phase 3 real auth (code side) landed on top of the v3 redesign: real Clerk SSO (`startSSOFlow` + `setActive`), Clerk→Supabase token bridge (`authBridge` applies the Clerk session JWT via `supabase.auth.setSession`), users-row sync with `users_insert_self` policy, `RoleGuard` on both route groups, session-aware entry route, profiles + home greeting read `useSession` (initials helper, real logout), staff demo toggle demo-only. Migration `20250924000002_phase3_auth.sql` converts `users.id` + FK columns `uuid → text` (real Clerk ids are `user_…`), rewrites RLS comparisons to `auth.uid()::text`, adds `users_insert_self`. `npm run typecheck` + `npm run lint` clean. Needs the two dashboard config steps (blockers above) + a live device pass to close AUTH-01/02. | Apply migration + dashboard config, provision `mayac@school.edu`, run AUTH-01/02, then Phase 4 data-layer screens                      |
