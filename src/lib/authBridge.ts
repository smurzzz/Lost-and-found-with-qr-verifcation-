/**
 * Clerk → Supabase token bridge (official third-party-auth integration).
 *
 * Supabase's supported Clerk integration (supabase.com/docs/guides/auth/
 * third-party/clerk) passes the plain CLERK SESSION TOKEN to Supabase —
 * NOT a JWT-template token. Supabase verifies the session token against
 * Clerk's published JWKS (registered under Authentication → Third-Party
 * Auth → Clerk) and resolves the caller from its claims.
 *
 * Requirements:
 *  - The Clerk session token must carry `role: "authenticated"` (Clerk
 *    dashboard → Configure → Sessions → Customize session token → add the
 *    claim). `sub` is always present automatically and equals the Clerk
 *    user id, which RLS compares to users.id via auth.jwt() ->> 'sub'.
 *
 * SessionProvider registers the Clerk getToken function here, and the
 * Supabase client (lib/supabase.ts) reads it through fetchSessionToken()
 * in its per-request `accessToken` callback — so every DB call carries a
 * freshly minted token (session tokens expire after ~60 s; a cached one
 * would silently degrade to anon after a minute).
 */

let clerkGetToken: ((opts: { template?: string }) => Promise<string | null>) | null = null;

/** Called by SessionProvider when a Clerk session exists (null on cleanup). */
export function setClerkTokenGetter(
  fn: ((opts: { template?: string }) => Promise<string | null>) | null,
): void {
  clerkGetToken = fn;
}

/** Fresh Clerk session token for the current request (null when signed out). */
export async function fetchSessionToken(): Promise<string | null> {
  if (!clerkGetToken) return null;
  return clerkGetToken({});
}

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
