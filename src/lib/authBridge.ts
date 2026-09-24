/**
 * Clerk → Supabase JWT bridge.
 *
 * ClaimIt uses Clerk for SSO identity (Google via the Clerk instance) and
 * Supabase (Postgres + RLS) as the data store. Supabase RLS requires a token
 * with `role: 'authenticated'` whose `sub` equals the users.id (which we sync
 * to Clerk's user.id). We apply a Clerk-issued `supabase` template JWT to the
 * Supabase client's session so PostgREST treats the caller as authenticated.
 *
 * Clerk lets you define a JWT template named `supabase` that includes:
 *   { "sub": "{{user.id}}", "role": "authenticated" }
 * `useAuth().getToken({ template: 'supabase' })` fetches it; session.tsx then
 * applies it via `supabase.auth.setSession({ access_token, refresh_token: null })`.
 *
 * If the template is missing or lacks the role claim, RLS executes as `anon`
 * and the users self-signup insert fails — the login screen decodes the token
 * claims below to surface exactly that.
 */

import { supabase } from '@/lib/supabase';

/** Decode a JWT payload for diagnostics (sub / role / iss, non-verifying). */
export function decodeJwtClaims(token: string): {
  sub?: string;
  role?: string;
  iss?: string;
} | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as { sub?: string; role?: string; iss?: string };
  } catch {
    return null;
  }
}

/**
 * Apply a Clerk `supabase` template token to the Supabase client session.
 * Call once the Clerk session is active. Passing null signs the Supabase
 * client out (fallback to anon / RLS denied).
 */
export async function applyClerkSupabaseToken(
  getToken: (opts: { template: string }) => Promise<string | null>,
): Promise<string | null> {
  if (!supabase) return null;
  const token = await getToken({ template: 'supabase' });
  if (!token) {
    await supabase.auth.signOut().catch(() => undefined);
    return null;
  }
  await supabase.auth.setSession({ access_token: token, refresh_token: '' });
  return token;
}
