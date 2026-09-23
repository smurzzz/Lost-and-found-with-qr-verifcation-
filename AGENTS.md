# AGENT.md — Instructions for AI coding agents working on ClaimIt

This file orients any AI coding assistant (Claude Code, Cursor, Copilot Workspace, etc.) working in this repository. Read this before making changes.

## What this project is

ClaimIt is a school Lost & Found mobile app (Expo/React Native, Android). Full context: `01-PROJECT-OVERVIEW.md`. Full technical design: `02-ARCHITECTURE.md`.

## The one rule you must never break

**An item's status may only become `claimed` through the single server-side release endpoint (`/api/items/:id/release`), gated behind an authenticated staff scan.** Do not:

- Add a UI button, admin action, or script that sets `items.status = 'claimed'` any other way.
- "Simplify" the release flow for testing convenience and leave it in.
- Relax the RLS policy restricting that column's update path, even temporarily.

If a task seems to require bypassing this, stop and flag it rather than implementing a workaround. This constraint is the entire premise of the project, not an incidental detail.

## Before you write code

1. Read `02-ARCHITECTURE.md` for the data model and the screen-to-module map.
2. Read `03-CODE-STANDARDS.md` for project structure, naming, and component conventions.
3. Check `07-PROGRESS-TRACKER.md` to see what's already built vs. planned, so you don't duplicate or conflict with existing work.
4. If touching anything in the release flow, matching logic, or claim transitions, check `05-TESTING-REPORT.md` for the critical-path cases your change must not break.

## Conventions summary (see CODE-STANDARDS.md for full detail)

- TypeScript strict mode, no untyped `any`.
- Screens under `/app`, grouped by role: `(student)`, `(staff)`, `(auth)`.
- Data fetching only through `/lib/hooks` (React Query), never inline `useEffect` + `fetch` in a screen component.
- Status-based styling always through `<StatusBadge>`, never ad-hoc color logic per screen.
- DB fields are `snake_case`; convert to `camelCase` at the API boundary only.

## When adding a new screen

1. Confirm which role it belongs to and place it in the correct route group.
2. Check the design docs (`claimit-design-prompt.md` / `claimit-design-prompt-minimal.md` if present in the repo) for the expected layout, colors, and copy before inventing new UI patterns.
3. Reuse existing components (`Card`, `StatusBadge`, `Button`, chip row, bottom nav) rather than creating parallel one-off versions.
4. Update `07-PROGRESS-TRACKER.md` for the task you completed.

## When adding or changing an API endpoint

1. State transitions on `items` or `claims` must go through a typed wrapper in `/lib/api`, never a raw Supabase client call from a component.
2. Any endpoint that could plausibly affect item status must be reviewed against the one rule above before merging.
3. Add or update the relevant row in `05-TESTING-REPORT.md`.

## Testing expectations for agent-authored changes

- Any change touching Staff Logging, Student Reporting, Matching, QR Release, or Audit modules should include or update a test case in `05-TESTING-REPORT.md`, even if the actual test run is left for a human to execute (mark as ⏳).
- Do not mark a critical-path test (`CP-01` through `CP-07`) as ✅ without it actually having been run — these guard the core feature.

## What not to do

- Don't introduce AI-based photo matching (explicitly out of scope — see PROJECT-OVERVIEW.md).
- Don't add SMS, email/password login, or social features — also explicitly excluded.
- Don't invent new status values or bypass the five-state item lifecycle (`pending_dropoff → available → pending_claim → claimed`, plus audit-only event types) without updating ARCHITECTURE.md first.
- Don't commit `.env` files or hardcode Supabase/Clerk keys.

## Where to record decisions

If you make an architectural or scope decision while implementing a task, add a note to `07-PROGRESS-TRACKER.md` under "Blockers / open questions" or the relevant milestone row, so a human reviewer can see what changed and why.
