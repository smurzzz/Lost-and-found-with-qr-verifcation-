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

> Phase 4 status: SL-01 is **fully implemented** (Log Found form → `log-found` Edge Function → server-minted signed QR token displayed on the QR Tag screen via `react-native-qrcode-svg`, real Found Items list on the dashboard). SL-02/03 are deferred by design (photo + edit/delete land after the release-flow constraint work). SL-04 needs a category/date filter on the staff list. All four stay ⏳ until a live run on device after the Phase 3 dashboard config is done.

### Confirm Receipt (student-reported items)

> Phase 8 status: the staff Student Reports tab lists real `pending_dropoff` items (`useStudentReports` → `fetchStudentReports`) and Confirm Receipt confirms through the new `/confirm-receipt` Edge Function — staff-gated, preconditioned on `source = 'student_reported'` + `status = 'pending_dropoff'` (confirms exactly once; 409 otherwise), mints the signed QR token via the shared `_shared/claimit.ts` path (same as `/log-found`), transitions the item to `available`, and writes a `confirmed` audit row (CP-04). Rows stay ⏳ until a live run.

| ID    | Case                                                   | Status |
| ----- | ------------------------------------------------------ | ------ |
| CR-01 | Student Reports tab lists a real pending drop-off item | ⏳     |
| CR-02 | Confirm generates QR + status → `available` (CP-04)    | ⏳     |
| CR-03 | Confirming twice (or a non-pending item) is rejected   | ⏳     |

### Student Reporting

| ID    | Case                                              | Status |
| ----- | ------------------------------------------------- | ------ |
| SR-01 | Submit lost item report, all fields               | ⏳     |
| SR-02 | Submit found item report, all fields              | ⏳     |
| SR-03 | Found report shows "Pending drop-off" immediately | ⏳     |
| SR-04 | Edit/cancel own lost report                       | ⏳     |

> Phase 5 status: SR-01 (→ `lost_reports`) and SR-02 (→ `items`, `pending_dropoff`, `qr_code NULL`) are implemented end to end; SR-03 is verifiable in the DB (the found-success screen shows the drop-off pill, and the row is `pending_dropoff`). SR-04 (edit/cancel) has no UI yet — deferred. All stay ⏳ until a live run (needs the Phase 3 dashboard config + running migrations).

### Matching

> Phase 6 status: matching is implemented end to end — `find_possible_matches` RPC (migration `20250924000004_phase6_matching.sql`), the `/match` Edge Function (owner/staff-gated, sets `lost_reports.status = possible_match`, writes `matched` audit rows, best-effort Expo push to `users.push_token`), and client token registration. M-01/M-02 stay ⏳ until a live run (needs migration 04 + `supabase functions deploy match` + `eas init` + a real device push token).

| ID   | Case                                                                 | Status |
| ---- | -------------------------------------------------------------------- | ------ |
| M-01 | Exact category + keyword match triggers notification                 | ⏳     |
| M-02 | No match found → report stays "Searching"                            | ⏳     |
| M-03 | Student browses feed and taps "This is mine" without a notification  | ⏳     |
| M-04 | "Not mine" dismisses card without side effects on other users' views | ⏳     |

### Claims

> Phase 7 status: Claim Verification writes a real claim — `insertClaim` (claim `status = 'pending'`; its `claim_requested` audit row is auto-created by the `claims_requested_audit_trigger` in migration `20250924000006_phase10_audit_auto.sql`, not by the client — RLS blocks students from `audit_log` inserts), and migration `20250924000005_phase7_claims.sql` adds a server-side trigger that moves the item `available → pending_claim` (never `claimed`; `pending_dropoff` left alone) plus a partial unique index rejecting a second _pending_ claim on the same item. The staff Pending Claims tab lists real `pending` claims with claimant + item (RLS covers staff reads). The _approved_ decision and the release gate arrive with Phase 9. Rows stay ⏳ until a live run.

| ID    | Case                                                 | Status |
| ----- | ---------------------------------------------------- | ------ |
| CL-01 | Student submits a claim with distinctive detail      | ⏳     |
| CL-02 | Staff Pending Claims tab lists the new pending claim | ⏳     |
| CL-03 | Item shows "Pending claim" after a claim is filed    | ⏳     |
| CL-04 | A second pending claim on the same item is rejected  | ⏳     |

### QR Release

| ID    | Case                                                 | Status |
| ----- | ---------------------------------------------------- | ------ |
| QR-01 | Successful scan + confirm release                    | ⏳     |
| QR-02 | Cancel mid-scan leaves item unclaimed                | ⏳     |
| QR-03 | Scan by unauthenticated/non-staff account is blocked | ⏳     |

> Phase 9 status: code-complete — the release flow is fully wired (scan.tsx real expo-camera QR → `fetchItemByQrCode` resolve → release.tsx real item/claim sheet with the RLS-based approve step → `/release` Edge Function, itemId in body → released.tsx real response). CP-05 (invalid scans rejected — a bogus or tampered tag never reaches the sheet, and `/release` returns `qr_mismatch` after **server-side HMAC signature verification** of the scanned token), CP-06 (release requires an approved claim — `409 claim_not_approved`), and CP-07 (every transition writes its audit row — `released` is written before `status='claimed'`) are code-verified but stay ⏳ until a live device run against a deployed `release` function. CP-01/CP-02 still guard the one-rule: only `/release` can set `claimed`, and the `items_status_lock` trigger backs it in DB.

### Audit & Reporting

| ID    | Case                                                 | Status |
| ----- | ---------------------------------------------------- | ------ |
| AL-01 | Filter by status (Unclaimed/Pending Claim/Claimed)   | ⏳     |
| AL-02 | Timeline expands with correct chronological order    | ⏳     |
| AL-03 | Export/print (if implemented) produces accurate data | N/A    |

> Phase 10 status: code-complete — `useAuditFeed` reads real `audit_log` rows (item + actor joins, RLS `audit_log_select`), `audit.tsx` filters by real item status (AL-01) and renders each item's events in chronological order with actor/System, timestamp and note (AL-02). Student-originated rows (`reported`, `claim_requested`) are auto-created by the SECURITY DEFINER triggers in migration `20250924000006_phase10_audit_auto.sql` (students hold no `audit_log` INSERT rights; the client write in `insertClaim` was removed). Rows stay ⏳ until a live run against a device lifecycle. AL-03 is out of the released scope (no export/print feature), so it is marked N/A rather than pending.

### Auth & Roles (Phase 3)

| ID      | Case                                                                                                                         | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| AUTH-01 | Student logs in with a real Google account → new users row (role `student`), routed to `(student)/home`                      | ⏳     |
| AUTH-02 | Staff member (pre-provisioned `users` row) logs in → routed to `(staff)/dashboard`                                           | ⏳     |
| AUTH-03 | Student cannot reach any `(staff)` route (deep link or nav) — RoleGuard bounces to student home                              | ⏳     |
| AUTH-04 | A second Google account that was never provisioned also signs up as a student (open signup, no domain allowlist)             | ⏳     |
| AUTH-05 | New staff email with no provisioned row → signs in as a student; staff role appears only after the admin upsert + re-sign-in | ⏳     |

> Gate prerequisites for the ⏳ auth rows: Supabase JWT Settings has Clerk configured as a **custom JWT issuer** (JWKS URL from Clerk → Advanced → API Keys), Clerk has a JWT template literally named **`supabase`** containing `"sub": "{{user.id}}"` and `"role": "authenticated"` (the default Clerk token has no role claim, so PostgREST sees `anon` and the self-signup insert fails RLS), and migration `20250924000002_phase3_auth.sql` is pushed (`users.id` → `text`). See 07-PROGRESS-TRACKER.md block/open-questions.

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
