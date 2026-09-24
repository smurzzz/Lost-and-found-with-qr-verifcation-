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

| Library                           | Purpose                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@clerk/expo`                     | SSO authentication (Google) | Google sign-in runs through Clerk (`useSSO` strategy `oauth_google`, `setActive` on the created session) — no Google Cloud project of our own. Any account self-registers as a student (RLS forces `role='student'`); staff are seeded invite-only. Session JWT is bridged to Supabase via the Clerk **`supabase`** JWT template (`sub` = Clerk user id, `role: 'authenticated'`) so RLS and Edge Functions resolve the caller correctly. |
| `expo-secure-store`               | Clerk token cache           | `@clerk/expo/token-cache` persists the Clerk device token in SecureStore (keyed by Clerk internally).                                                                                                                                                                                                                                                                                                                                     |
| `expo-auth-session`/`web-browser` | OAuth browser shell         | Used by `@clerk/expo` internally to open/close the OAuth consent window on device. The `auth.expo.io` proxy integration was removed in this SDK — Clerk's native flow redirects back to the app itself, so no proxy is configured.                                                                                                                                                                                                        |

## Backend / data

| Library                 | Purpose                      | Notes                                                                                                    |
| ----------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@supabase/supabase-js` | DB client, storage, realtime | Client initialized once in `/lib/supabase.ts`; never instantiate per-component                           |
| `@tanstack/react-query` | Server state caching         | All list/detail fetches (items, claims, audit log) go through hooks in `/lib/hooks`, not raw `useEffect` |

## Camera / QR

| Library                     | Purpose                                                                                              | Notes                                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-camera`               | Camera access for scanning                                                                           | Used in Scan-to-Release screen only                                                                                                                             |
| `react-native-qrcode-svg`   | Client-side QR rendering                                                                             | Encodes the server-minted signed token (`<itemId>.<HMAC>`) into a scannable QR on the QR Tag screen (Phase 4)                                                   |
| (QR decode, Phase 9)        | Read QRs via `expo-camera`'s built-in barcode scanning (`CameraView` + `onBarcodeScanned`)           | SDK 57 bundles a barcode detector; no separate `expo-barcode-scanner` install needed                                                                            |
| QR generation (server-side) | Mints the signed QR token in the shared `_shared/claimit.ts` (`signedQrToken`); NOT done client-side | HMAC-SHA256 over the item id with the `CLAIMIT_QR_SECRET` function secret; partial unique index on `qr_code`; scanning re-validates the signature in `/release` |

## Notifications

| Library              | Purpose                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-notifications` | Push notification permission + delivery | Push token stored per user; triggered server-side on match events. **Expo Go caveat (SDK 53+):** Android remote-push support was removed from Expo Go and the module now throws at evaluation time there — `src/lib/push.ts` loads it lazily via `import('expo-notifications')` only when `Constants.executionEnvironment !== StoreClient`. Needs a devex/development build (`eas build --profile development`) to actually mint/deliver tokens |

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

Pin exact versions (no `^` or `~`) for: `expo`, `@clerk/expo`, `@supabase/supabase-js`. These are the libraries most likely to introduce breaking changes across the project's lifetime; everything else can follow normal semver ranges (note: `expo-auth-session`/`expo-web-browser` must stay at the SDK's paired version with `expo`).
