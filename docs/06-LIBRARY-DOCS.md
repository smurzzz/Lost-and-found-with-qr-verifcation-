# ClaimIt — Library & Dependency Docs

Reference for every external dependency, why it's used, and where.

## Core framework

| Library        | Purpose               | Notes                                                                |
| -------------- | --------------------- | -------------------------------------------------------------------- |
| `expo`         | App framework/runtime | Managed workflow; EAS Build for Android APK output                   |
| `expo-router`  | File-based navigation | Route groups split by role: `(student)`, `(staff)`, `(auth)`         |
| `react-native` | Core RN               | via Expo SDK, pinned version — check `app.json` for exact SDK number |
| `typescript`   | Type safety           | strict mode; see CODE-STANDARDS.md                                   |

## Auth

| Library             | Purpose            | Notes                                                                                                                                                |
| ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@clerk/clerk-expo` | SSO authentication | Handles both student self-signup (domain-restricted allowlist) and staff invite-only flows. Session token passed to Supabase for RLS-aware requests. |

## Backend / data

| Library                 | Purpose                      | Notes                                                                                                    |
| ----------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@supabase/supabase-js` | DB client, storage, realtime | Client initialized once in `/lib/supabase.ts`; never instantiate per-component                           |
| `@tanstack/react-query` | Server state caching         | All list/detail fetches (items, claims, audit log) go through hooks in `/lib/hooks`, not raw `useEffect` |

## Camera / QR

| Library                                                                                         | Purpose                                                                                   | Notes                                                                                                |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `expo-camera`                                                                                   | Camera access for scanning                                                                | Used in Scan-to-Release screen only                                                                  |
| `expo-barcode-scanner` (or `expo-camera`'s built-in barcode scanning, depending on SDK version) | QR decode                                                                                 | Confirm which API your Expo SDK version recommends — this has changed across SDK releases            |
| QR generation (server-side)                                                                     | Encodes item ID + a signed token, not just the raw item ID, to prevent trivial QR forgery | Consider a library like `qrcode` (Node) inside the Edge Function, or a Supabase-side generation step |

## Notifications

| Library              | Purpose                                 | Notes                                                             |
| -------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `expo-notifications` | Push notification permission + delivery | Push token stored per user; triggered server-side on match events |

## Forms / UI

| Library                                                          | Purpose                 | Notes                                                                        |
| ---------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| `react-hook-form` (suggested)                                    | Form state + validation | Keeps validation logic out of screen components                              |
| `zod` (suggested)                                                | Schema validation       | Pairs with react-hook-form; also usable to validate API payloads server-side |
| date/time picker (e.g. `@react-native-community/datetimepicker`) | Date lost/found fields  |                                                                              |
| image picker (`expo-image-picker`)                               | Optional photo upload   |                                                                              |

## Dev tooling

| Library                      | Purpose               | Notes                   |
| ---------------------------- | --------------------- | ----------------------- |
| `eslint` + `eslint-config-*` | Linting               | Run via pre-commit hook |
| `prettier`                   | Formatting            | Run via pre-commit hook |
| `husky` + `lint-staged`      | Pre-commit automation |                         |

## Environment variables required

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

Never commit `.env` — confirm it's in `.gitignore`. Service-role Supabase keys (used only in Edge Functions, never client-side) are set as Supabase project secrets, not app environment variables.

## Version pinning policy

Pin exact versions (no `^` or `~`) for: `expo`, `@clerk/clerk-expo`, `@supabase/supabase-js`. These are the libraries most likely to introduce breaking changes across the project's lifetime; everything else can follow normal semver ranges.
