# ClaimIt — Clerk + Supabase dashboard setup

The one-time configuration that connects the three services. The code side
(Phase 3 auth, JWT bridge, edge functions) is already committed; this is the
click-through for the dashboards plus the CLI deploy commands.

> Project ref (from `.env`): `yunhwfguknapqtrjouwv` → `https://yunhwfguknapqtrjouwv.supabase.co`

---

## 1. Clerk — Google SSO + the `supabase` JWT template

1. Open <https://dashboard.clerk.com> → your application.
2. **API Keys** → copy the _Publishable key_ → it belongs in `.env` as
   `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (already set).
3. **Configure → SSO Connections → Google** → enable. Clerk hosts the OAuth
   app (no Google Cloud project of our own); on a development instance it
   works immediately with Clerk's shared Google credentials.
4. **Configure → JWT Templates** → _New template_ → pick the built-in
   **Supabase** option. Replace the claims with exactly:

   ```json
   {
     "role": "authenticated"
   }
   ```

   - Do **not** declare `"sub": "{{user.id}}"` — `sub` is a reserved claim
     that Clerk adds automatically (it always equals the Clerk user id) and
     the dashboard rejects templates that declare it ("You can't use the
     reserved claim: sub").
   - Name the template **`supabase`** — the app requests it by that name
     (`getToken({ template: 'supabase' })` in `authBridge.ts`).
   - Leave the signing key as the default ("Internal").
   - `role: 'authenticated'` is what makes Supabase RLS treat the caller as
     a signed-in user; the automatic `sub` claim (the Clerk user id) is what
     RLS policies compare against via `auth.jwt() ->> 'sub'`.

   > **RLS must use `auth.jwt() ->> 'sub'`, never `auth.uid()`.** Clerk user
   > ids are not UUIDs (`user_2xY…`), and `auth.uid()` casts `sub` to uuid —
   > it returns NULL for every Clerk caller. Policies that use `auth.uid()`
   > fail with "new row violates row-level security policy" on the first-login
   > users insert. Migration `20250924000003_clerk_sub_rls_fix.sql` rewrites
   > all of them to the raw `sub` string.

## 2. Supabase — accept Clerk tokens

1. Open the Supabase project → **Authentication → Third-Party Auth**
   (on older projects: **Authentication → JWT Settings**).
2. **Add** → choose **Clerk** → paste your Clerk _Frontend API URL_
   (Clerk dashboard → API Keys → `https://<slug>.clerk.accounts.dev`) as the
   issuer. Supabase now verifies incoming JWTs against Clerk's JWKS.
3. **Project Settings → API** → confirm URL + anon key are in `.env` as
   `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (already set).

## 3. Migrations (already applied ✅)

Verified live: `GET /rest/v1/items` returns `200`. If a fresh project ever
needs them:

```bash
supabase link --project-ref yunhwfguknapqtrjouwv
supabase db push            # applies supabase/migrations in filename order
```

(or paste each migration into the SQL editor, oldest first). The seed file
creates demo items plus a staff row — see §5 for real staff accounts.

## 4. Deploy the edge functions

The functions (`log-found`, `confirm-receipt`, `release`, `match`) live in
`supabase/functions/` and import `../_shared/claimit.ts`, which the CLI
bundles automatically.

```bash
npm i -g supabase            # once
supabase login               # creates a SUPABASE_ACCESS_TOKEN in the browser
supabase link --project-ref yunhwfguknapqtrjouwv

# one shared secret for signed QR tags (HMAC key); SUPABASE_URL and
# SUPABASE_SERVICE_ROLE_KEY are injected by Supabase automatically:
supabase secrets set CLAIMIT_QR_SECRET=$(openssl rand -hex 32)

supabase functions deploy log-found
supabase functions deploy confirm-receipt
supabase functions deploy release
supabase functions deploy match
```

(No Docker needed — recent CLIs deploy over the API; add `--use-api` if yours
insists.) The status check that told us this was outstanding:

- `POST /functions/v1/log-found` → currently `404` until the deploy above.

## 5. Staff provisioning (invite-only)

Students self-register on first Google login (RLS forces `role='student'`).
Staff must exist with `role='staff'` **before** their first login:

1. They sign in once with Google (lands as student — that's fine), or copy
   their Clerk id from Clerk dashboard → **Users** (`user_2…`).
2. In the Supabase SQL editor:

   ```sql
   insert into users (id, role, name, email)
   values ('user_2XXXXXX', 'staff', 'Their Name', 'their@email')
   on conflict (id) do update set role = 'staff';
   ```

They re-sign-in and the role guard routes them to the staff dashboard.

## 6. Smoke test

1. `npx expo start` → sign in with Google.
2. First login inserts a `users` row (check Table Editor → `users`).
3. Student lands on Home; a provisioned staff account lands on the staff
   dashboard.
4. Log a found item from the staff app → the QR Tag screen shows a scannable
   signed tag (proves `CLAIMIT_QR_SECRET` is set and the function deployed).
