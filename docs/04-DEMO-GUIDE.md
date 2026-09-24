# ClaimIt — Demo Guide

Use this script for a live walkthrough (defense, class demo, or stakeholder review). Two devices/accounts recommended: one Student, one Staff.

## Setup checklist

- [ ] Seed at least 2–3 found items already in the system (mixed source: one staff-logged, one student-reported/pending)
- [ ] Seed 1 open lost report on the demo Student account that matches one seeded item
- [ ] Confirm push notifications are enabled on the demo device
- [ ] Confirm camera permissions granted for QR scanning on the Staff device

## Demo flow (~8–10 minutes)

### Part 1 — Student reports a lost item (2 min)

1. Log in as Student.
2. From Home, tap **+ Report Lost Item**.
3. Fill category, description, date, location; submit.
4. Point out: this creates an open report the system will keep checking against new found items — nothing is claimable yet.

### Part 2 — Staff logs a found item directly (1.5 min)

1. Switch to Staff device.
2. From Staff Dashboard, tap **+ Log Found Item**.
3. Fill the form; submit.
4. Show the **QR Tag Ready** screen — emphasize the QR is generated immediately here because staff already has physical possession.

### Part 3 — A student reports finding something (2 min)

1. Back on Student device, tap **+ Report Found Item**.
2. Fill the form; submit.
3. Show the **"Pending drop-off"** confirmation — explain the item is now visible to everyone but not yet claimable, because staff hasn't taken custody.
4. Switch to Staff device → **Student Reports** tab → show the same item with a **Confirm Receipt** button.
5. Tap it → **Confirm Receipt & Generate QR** → show the QR now generates only at this point. This is the key talking point: _self-reporting is open, but the QR — and therefore claimability — only exists after staff custody is confirmed._

### Part 4 — Matching and claiming (2 min)

1. On Student device, show the push notification (or open **Possible Matches** directly) for the report seeded in Part 1.
2. Tap **This is mine** → fill "What's distinctive about this item?" → **Submit Claim**.
3. Explain: this creates a pending claim; nothing has been released yet.

### Part 5 — The core feature: QR-verified release (2 min)

1. Switch to Staff device → **Scan** tab.
2. Scan the item's QR tag (use a printed/on-screen QR from Part 2 or 3 for the demo).
3. Show the confirmation sheet: claimant name, verification answer, claim status.
4. Tap **Confirm Release** → show the "Item Released" success state.
5. **This is the moment to state explicitly:** no other button, screen, or admin action in the entire app can mark this item claimed — only this scan.

### Part 6 — Audit trail (1 min)

1. Staff Dashboard → **Audit Log**.
2. Open the just-released item, show the full timeline: Found/Reported → Confirmed → Matched → Claim Requested → Released, each with actor and timestamp.
3. Close with: this is the proof-of-custody record the whole design exists to produce.

## Anticipated questions & short answers

- **"What if a student lies about finding something they didn't?"** — It stays "Pending drop-off" indefinitely; it's never claimable and never shows as staff-verified until physically handed in.
- **"What if two students both tap 'This is mine'?"** — Both create separate pending claims; staff reviews and approves only one during the scan/release step.
- **"Why not let staff mark items claimed manually for convenience?"** — That would defeat the entire audit-trail guarantee the project is built around; it's a deliberate hard constraint, not an oversight.
- **"Could this scale to a real deployment?"** — Yes; the current schema and role model (Clerk Google-SSO student self-signup, invite-only staff seeded in `users`) already support multi-building/multi-department use without redesign.
