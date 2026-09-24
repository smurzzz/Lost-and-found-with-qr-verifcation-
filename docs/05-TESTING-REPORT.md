# ClaimIt — Testing Report

> Fill in ✅ / ❌ / ⏳ per row as tests are actually run. This document ships as a template with the test cases the architecture requires, not pre-filled results.

## 1. Scope

Manual and automated testing covering the five core modules: Staff Logging, Student Reporting, Matching, QR Release, Audit & Reporting — with special emphasis on the release-flow constraint, since it's the project's core guarantee.

## 2. Test environment

- Device(s): _____________________
- Expo build channel: _____________________
- Backend: Supabase (project: _____________________)
- Test accounts: 1 Student, 2 Staff (to test multi-staff audit attribution)

## 3. Critical-path test cases (must pass before any demo/submission)

| ID    | Case                                                | Steps                                                                                     | Expected result                                                                                                   | Status |
| ----- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ |
| CP-01 | Item cannot be claimed without a scan               | Attempt to set an item's status to "claimed" via any UI path other than Scan-to-Release   | Blocked / no such path exists                                                                                     | ⏳     |
| CP-02 | Direct API call bypass attempt                      | Call `/api/items/:id` with a raw status update to `claimed` (not via `/release` endpoint) | Rejected by RLS/endpoint validation                                                                               | ⏳     |
| CP-03 | Student-reported item has no QR before confirmation | Report a found item as Student; inspect item record                                       | `qr_code` is null, status is `pending_dropoff`                                                                    | ⏳     |
| CP-04 | QR generated only after staff confirms              | Staff taps Confirm Receipt & Generate QR                                                  | `qr_code` populated, status → `available`                                                                         | ⏳     |
| CP-05 | Scan with wrong/expired QR is rejected              | Scan a QR from a different item, or a tampered code                                       | Scan fails with clear error, no status change                                                                     | ⏳     |
| CP-06 | Release requires an approved claim                  | Attempt to release an item with no pending/approved claim attached                        | Blocked with explanit error                                                                                       | ⏳     |
| CP-07 | Audit log entry created on every transition         | Walk an item through full lifecycle                                                       | 5 audit_log rows created (reported/found, confirmed, matched, claim_requested, released), each with correct actor | ⏳     |

## 4. Functional test cases by module

### Staff Logging

| ID    | Case                                           | Status |
| ----- | ---------------------------------------------- | ------ |
| SL-01 | Log found item with all required fields        | ⏳     |
| SL-02 | Log found item with photo upload               | ⏳     |
| SL-03 | Edit/delete an item before it's claimed        | ⏳     |
| SL-04 | Search/filter found items by category and date | ⏳     |

### Student Reporting

| ID    | Case                                              | Status |
| ----- | ------------------------------------------------- | ------ |
| SR-01 | Submit lost item report, all fields               | ⏳     |
| SR-02 | Submit found item report, all fields              | ⏳     |
| SR-03 | Found report shows "Pending drop-off" immediately | ⏳     |
| SR-04 | Edit/cancel own lost report                       | ⏳     |

### Matching

| ID   | Case                                                                 | Status |
| ---- | -------------------------------------------------------------------- | ------ |
| M-01 | Exact category + keyword match triggers notification                 | ⏳     |
| M-02 | No match found → report stays "Searching"                            | ⏳     |
| M-03 | Student browses feed and taps "This is mine" without a notification  | ⏳     |
| M-04 | "Not mine" dismisses card without side effects on other users' views | ⏳     |

### QR Release

| ID    | Case                                                 | Status |
| ----- | ---------------------------------------------------- | ------ |
| QR-01 | Successful scan + confirm release                    | ⏳     |
| QR-02 | Cancel mid-scan leaves item unclaimed                | ⏳     |
| QR-03 | Scan by unauthenticated/non-staff account is blocked | ⏳     |

### Audit & Reporting

| ID    | Case                                                 | Status |
| ----- | ---------------------------------------------------- | ------ |
| AL-01 | Filter by status (Unclaimed/Pending Claim/Claimed)   | ⏳     |
| AL-02 | Timeline expands with correct chronological order    | ⏳     |
| AL-03 | Export/print (if implemented) produces accurate data | ⏳     |

### Auth & Roles (Phase 3)

| ID      | Case                                                                                                                  | Status |
| ------- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| AUTH-01 | Student logs in with a real school-domain Google account → new users row (role `student`), routed to `(student)/home` | ⏳     |
| AUTH-02 | Staff member (pre-provisioned `users` row) logs in → routed to `(staff)/dashboard`                                    | ⏳     |
| AUTH-03 | Student cannot reach any `(staff)` route (deep link or nav) — RoleGuard bounces to student home                       | ⏳     |
| AUTH-04 | Student logs in with a non-school-domain google account → blocked with the domain message                             | ⏳     |
| AUTH-05 | New staff email with no provisioned row → "not provisioned" error, no row created                                     | ⏳     |

> Gate prerequisites: Supabase JWT issuer added for Clerk, Clerk `supabase` JWT template exists, and migration `20250924000002_phase3_auth.sql` pushed (`users.id` → `text`). See 07-PROGRESS-TRACKER.md block/open-questions.

## 5. Non-functional checks

| ID    | Case                                                                               | Status |
| ----- | ---------------------------------------------------------------------------------- | ------ |
| NF-01 | All touch targets ≥ 48px on target device                                          | ⏳     |
| NF-02 | App handles no-network state gracefully (no crash)                                 | ⏳     |
| NF-03 | Camera permission denial shows recovery path, not silent failure                   | ⏳     |
| NF-04 | Push notification permission denial degrades gracefully (in-app badge still works) | ⏳     |

## 6. Known issues log

| Date | Issue | Severity | Status |
| ---- | ----- | -------- | ------ |
|      |       |          |        |

## 7. Sign-off

| Role      | Name | Date | Notes |
| --------- | ---- | ---- | ----- |
| Developer |      |      |       |
| Reviewer  |      |      |       |
