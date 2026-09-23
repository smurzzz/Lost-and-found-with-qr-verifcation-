# ClaimIt — Functionality Prompt (All Screens)

This is a build prompt for implementing **functionality**, not visuals — pair it with the HTML/CSS or Figma design files for layout, and `02-ARCHITECTURE.md` for the data model. Hand this to an AI coding agent or use it as your own implementation checklist, one screen at a time.

---

## 1. Login / Onboarding

**Purpose:** authenticate via SSO, route to the correct role's home screen.

- On tap "Continue with SSO": trigger Clerk's SSO flow.
- On success: check `users.role` for this account.
  - If no `users` row exists yet (first login) and email matches the student domain allowlist → create a `student` row, route to Student Home.
  - If no `users` row exists and email does not match the allowlist → block with a message explaining staff accounts must be invited by an admin.
  - If a `users` row exists → route based on `role` (`student` → Student Home, `staff`/`admin` → Staff Dashboard).
- On failure/cancel: stay on screen, show a non-blocking error.
- Persist session; app should skip this screen on relaunch if a valid session exists.

---

## 2. Student Home

**Purpose:** browse the shared found-items feed, act on matches, navigate to reporting.

- On load: fetch found items (`status != pending_dropoff` for full visibility, but pending_dropoff items should also render with the pending badge per the design — don't filter them out, just badge them) ordered newest first.
- Search bar: client-side or server-side filter on `title`/`description` as the user types (debounce ~300ms).
- Category chips: filter the same feed client-side; "All" clears the filter.
- Each card's "This is mine": navigate to Claim Verification, passing the item ID.
- Each card's "Not mine": remove the card from this user's current view only (no server write needed — it's a personal dismissal, not a record). Optional: store dismissed IDs locally to persist across app restarts.
- "My Lost Reports" section: fetch `lost_reports` where `reported_by = current user`, show status badge per row.
- Floating "+" button: navigate to a picker (Report Lost vs. Report Found) or directly to Report Lost if that's the primary action per your nav design.
- Pull-to-refresh re-fetches the feed.

---

## 3. Report a Lost Item

**Purpose:** create a `lost_reports` row.

- Required fields: category, description, date lost, location lost. Photo optional.
- Validate all required fields non-empty before enabling "Submit Report."
- On submit: insert into `lost_reports` with `status = 'searching'`, `reported_by = current user`.
- On success: navigate back to Student Home; new report should appear in "My Lost Reports" without requiring a manual refresh (invalidate the React Query cache for that list).
- On failure: show inline error, keep form data intact (don't clear on failure).

---

## 4. Report a Found Item

**Purpose:** create an `items` row with `source = 'student_reported'`, `status = 'pending_dropoff'`.

- Required fields: category, description, location found, date found. Photo optional but strongly encouraged (helper copy already covers this).
- On submit: insert into `items` with `status = 'pending_dropoff'`, `qr_code = null`, `reported_by = current user`.
- Write an `audit_log` row with `event_type = 'reported'`.
- Show the "Pending drop-off — please bring it to the Front Desk" confirmation state after submit, not just a generic success toast.
- This item should now appear in the shared feed (Student Home) with the pending badge, and in Staff's "Student Reports" tab — confirm both list queries pick it up without a manual refresh.

---

## 5. Possible Matches

**Purpose:** show items the matching engine flagged against the current user's open lost report(s); allow Mine/Not mine from here too.

- On load: fetch items where a match score (per the matching logic in `02-ARCHITECTURE.md` §6) exceeds the threshold against any of this user's `searching` lost reports.
- "This is mine": same behavior as the Home feed — navigate to Claim Verification.
- "Not mine": dismiss this specific match card; optionally lower future match confidence for this pairing (not required for v1).
- Empty state: if no matches, show the "No possible matches yet" illustration/copy, not a blank screen.
- This screen is also the target of the push-notification deep link — confirm the notification payload includes the relevant item ID so the app can scroll/highlight it.

---

## 6. Claim Verification

**Purpose:** create a `claims` row.

- Display the selected item's details (read-only, fetched by item ID passed in).
- Required field: verification answer ("what's distinctive about this item?") — must be non-empty, reasonable minimum length (e.g., 5+ characters) to discourage junk answers.
- On submit: insert into `claims` with `status = 'pending'`, `item_id`, `claimant_id = current user`, `verification_answer`.
- Update the related item's status to `pending_claim` if not already.
- Write an `audit_log` row with `event_type = 'claim_requested'`.
- Show the "Claim Submitted" confirmation state, explaining staff will verify before release.

---

## 7. Staff Dashboard

**Purpose:** staff's operational home — three tabs over one shared underlying dataset.

- Summary cards (Found Items / Pending Claims / Student Reports): counts, likely `This week` scoped — decide and document the actual date window (last 7 days from `created_at`).
- **Found Items tab:** all items regardless of source, with a "Logged by staff / Reported by student" tag per card.
- **Pending Claims tab:** claims with `status = 'pending'`, joined to item and claimant info.
- **Student Reports tab:** items with `source = 'student_reported'` and `status = 'pending_dropoff'`; each card's "Confirm Receipt" navigates to the Confirm Receipt screen with the item ID.
- Floating "+" → Log Found Item.
- "Scan" nav item → Scan QR to Release screen (must be reachable directly, not buried).

---

## 8. Log Found Item (staff)

**Purpose:** create an `items` row with `source = 'staff_logged'`, QR generated immediately.

- Required fields: category, description, found location, found date (default to today). Photo optional.
- On submit: insert into `items` with `status = 'available'`, `source = 'staff_logged'`, `confirmed_by = current staff user`, `confirmed_at = now()`.
- Generate `qr_code`: a signed token (item ID + secret, not just the raw ID — see `02-ARCHITECTURE.md` §3 note on QR generation) via a server-side function, not client-side, to prevent forgery.
- Write an `audit_log` row with `event_type = 'found'`.
- Navigate to the QR Tag Ready screen with the new item's data.

---

## 9. Confirm Receipt (staff-side, for student-reported items)

**Purpose:** transition a student-reported item from `pending_dropoff` to `available`, generating its QR for the first time.

- Load the item by ID (passed from the Student Reports tab), including who reported it.
- "Confirm Receipt & Generate QR": update `items.status = 'available'`, set `confirmed_by`/`confirmed_at`, generate `qr_code` server-side (same generation path as Log Found Item — don't duplicate this logic, share it).
- Write an `audit_log` row with `event_type = 'confirmed'`.
- "Not Received Yet": no-op / dismiss — item remains `pending_dropoff`. Optionally allow staff to add a note (e.g., "student hasn't dropped off yet") — not required for v1.
- On confirm success: navigate to the Receipt Confirmed / QR Tag screen.

---

## 10. Receipt Confirmed / QR Tag

**Purpose:** display the generated QR and item details; allow printing.

- Read-only display of the item's final record post-QR-generation: item name, category, found location, claim/tag ID, status.
- "Print Tag": trigger platform print/share sheet with a print-formatted version of the tag (image or PDF). If print isn't implemented in early phases, this can share/export instead — document which behavior is actually shipped.
- "Done": return to the relevant dashboard (Staff Dashboard's Found Items tab, refreshed).

---

## 11. Scan QR Tag (release)

**Purpose:** the core feature. Validate a QR scan and, on staff confirmation, release the item.

- Request camera permission on mount; handle denial with a clear recovery message (link to device settings), not a silent blank camera view.
- On successful QR decode: parse the signed token, verify it against the backend (don't trust the client-decoded payload alone — re-validate server-side).
  - If invalid/tampered/expired: show an error state, do not proceed to the confirmation sheet.
  - If valid: fetch the associated item + its most recent `pending`/`approved` claim, populate the bottom sheet (claimant name, verification answer, claim status).
  - If the item has no pending/approved claim: show an error ("No approved claim for this item") — do not allow release.
- "Confirm Release": call the `/api/items/:id/release` endpoint from `02-ARCHITECTURE.md` §4, passing the scanned token, claim ID, and staff ID. This is the only place in the entire app that may trigger this endpoint.
- On success: show "Item Released," write is handled server-side (client just reflects the result — the audit_log row is created by the endpoint, not by this screen directly).
- "Cancel": abort without any state change.

---

## 12. Audit Log

**Purpose:** read-only chronological record.

- Status filter chips (All/Unclaimed/Pending Claim/Claimed) filter the item list by current `items.status`.
- Tapping an item expands its full `audit_log` history in chronological order, each row showing `event_type`, `actor`, `timestamp`, and a human-readable action line.
- This screen should never expose any write action — it's purely observational, by design.

---

## 13. Profile

**Purpose:** minimal account screen.

- Display current user's name, avatar (if any), and role badge.
- "Notification Settings": link to device notification settings or an in-app preferences screen if one exists.
- "Help & Support": static content or a mailto/contact link — decide and document which.
- "Log Out": clear Clerk session, clear any cached React Query data, navigate to Login.

---

## Cross-screen rules that apply everywhere

- Every list screen (Home feed, Staff tabs, Audit Log) should handle three states explicitly: loading, empty, and error — never leave a blank screen with no explanation.
- Every mutation (submit, confirm, release) should disable its trigger button while the request is in flight, to prevent duplicate submissions.
- Every form should preserve entered data on a failed submit — never silently clear the user's input.
