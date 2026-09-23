# ClaimIt — Code Standards

## 1. Project structure

```
/app
  /(auth)/login.tsx
  /(student)/home.tsx
  /(student)/report-lost.tsx
  /(student)/report-found.tsx
  /(student)/matches.tsx
  /(student)/claim-verify.tsx
  /(student)/profile.tsx
  /(staff)/dashboard.tsx
  /(staff)/log-found.tsx
  /(staff)/confirm-receipt.tsx
  /(staff)/scan-release.tsx
  /(staff)/audit-log.tsx
/components        # shared, reusable UI (Card, StatusBadge, Button, etc.)
/lib
  /supabase.ts      # client init
  /api              # typed API call wrappers, one file per resource
  /hooks            # React Query hooks (useItems, useClaims, etc.)
/types              # shared TypeScript types, mirrored from DB schema
/constants          # colors, spacing, category lists
```

## 2. Language & tooling

- TypeScript, strict mode on (`"strict": true` in `tsconfig.json`). No `any` without a `// TODO` comment explaining why.
- ESLint + Prettier, run on pre-commit (husky + lint-staged).
- Path aliases (`@/components`, `@/lib`) over long relative imports.

## 3. Naming conventions

- Components: `PascalCase` (`StatusBadge.tsx`)
- Hooks: `useCamelCase` (`useItemMatches.ts`)
- Files that export a single screen: match the route name (`report-found.tsx`)
- DB fields: `snake_case` (matches Postgres); convert to `camelCase` at the API boundary, not throughout the UI layer.
- Booleans read as questions: `isPendingDropoff`, `hasPhoto`.

## 4. Component rules

- One component per file. No default-exported anonymous functions.
- Presentational components take props only — no direct Supabase calls inside a `.tsx` that also renders UI. Data fetching lives in hooks (`/lib/hooks`), consumed by screens.
- Status-dependent styling (gray/amber/emerald) goes through a single `<StatusBadge status={...}>` component, never ad-hoc color logic repeated per screen.

## 5. State & data fetching

- Server state (items, claims, users) via React Query. No component-level `useEffect` + `fetch` for data that's reused elsewhere.
- Mutations that change item status go through the typed wrappers in `/lib/api`, never a raw Supabase call inline in a component — this keeps the release-flow constraint auditable in one place.
- Local-only UI state (form inputs, modal open/close) stays in component state; don't lift it into global state unless shared across screens.

## 6. The one rule that can't be broken

**No client-side code may set `items.status = 'claimed'` directly.** All release logic goes through the single `/api/items/:id/release` endpoint described in ARCHITECTURE.md. Any PR that adds a second path to "claimed" status should be rejected in review, no exceptions — this is the entire premise of the app.

## 7. Error handling

- All async calls wrapped in try/catch; user-facing errors surface as a toast/inline message, never a silent failure.
- Network/camera permission failures (QR scan, photo upload) show a specific recovery action, not a generic "Something went wrong."

## 8. Git workflow

- Branch naming: `feature/short-description`, `fix/short-description`.
- Commit messages: imperative mood, present tense (`Add confirm-receipt screen`, not `Added` or `Adding`).
- PRs require at least one review before merge to `main`.
- No direct commits to `main`.

## 9. Testing expectations

See `05-TESTING-REPORT.md` for current coverage. New logic touching the release flow, matching logic, or claim status transitions requires at least one test case before merge.

## 10. Accessibility & UX baseline

- All touch targets ≥ 48px.
- Color is never the only status indicator — pair with a text label (already the case per the design system: "Pending drop-off", "Available", etc.).
- Form inputs have visible labels, not placeholder-only fields.
