# ClaimIt — Progress Tracker

> Update status per task as work happens. Status legend: 🔲 Not started · 🟡 In progress · ✅ Done · 🔴 Blocked

## Milestone 1 — Foundations

| Task                                                  | Owner    | Status | Notes                                                                                  |
| ----------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------------------------- |
| Repo scaffolded (Expo + TypeScript + Router)          | Codebuff | ✅     | Phase 0 done — project root on Expo SDK 57, strict TS, expo-router; committed          |
| Supabase project created, schema migrated             |          | 🔲     | wiring ready (`src/lib/supabase.ts`); needs real project URL/anon key in `.env` (0.4)  |
| Clerk project set up, domain allowlist configured     |          | 🔲     | wiring ready (`ClerkProvider` in `_layout.tsx`); needs publishable key in `.env` (0.4) |
| Design system tokens implemented (colors, typography) |          | 🔲     | template tokens in place; full pass in Phase 1                                         |
| Navigation shell (student + staff route groups)       |          | 🔲     | Phase 1                                                                                |

## Milestone 2 — Auth & Roles

| Task                                         | Owner | Status | Notes |
| -------------------------------------------- | ----- | ------ | ----- |
| Student self-signup (SSO, domain-restricted) |       | 🔲     |       |
| Staff invite-only provisioning flow          |       | 🔲     |       |
| Role-based route guarding                    |       | 🔲     |       |
| Profile screen                               |       | 🔲     |       |

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

| Date raised | Blocker | Owner | Resolution |
| ----------- | ------- | ----- | ---------- |
|             |         |       |            |

## Weekly log

| Week of    | Summary                                                                                                                                                                                                                                                             | Next steps                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-22 | Phase 0 (0.1–0.3, 0.5–0.7) complete on Expo SDK 57: tooling verified, project root scaffolded, deps installed, ESLint/Prettier/husky set up, `.env`/`.env.example`/`app.config.ts` wired, expo-doctor 21/21, Android bundle exports, dev server verified, committed | 0.4: create Supabase + Clerk projects with real keys → fill `.env`; set up EAS project (`eas init`); push repo to remote; then Phase 1 |
