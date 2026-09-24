import * as SecureStore from 'expo-secure-store';

import { CLERK_TOKEN_KEY } from '@/constants/keys';
import { supabase } from '@/lib/supabase';

/**
 * Bridge between Clerk (identity) and Supabase (data). SessionProvider
 * registers a live supplier for the Clerk session JWT; this module stamps the
 * Supabase client's Authorization header with that token so Row-Level Security
 * resolves auth.uid() to the Clerk user. Requires the Supabase project to be
 * configured to verify Clerk JWTs (custom JWT issuer — see docs/07-PROGRESS-TRACKER).
 */

/** Fetches the current Clerk session token (may be null when signed out). */
type TokenSupplier = () => Promise<string | null>;

let tokenSupplier: TokenSupplier | null = null;

/** Register the live Clerk token supplier (wired by SessionProvider). */
export function registerTokenSupplier(supplier: TokenSupplier | null): void {
  tokenSupplier = supplier;
}

async function getClerkSupabaseTokenInternal(): Promise<string | null> {
  if (tokenSupplier) {
    try {
      const token = await tokenSupplier();
      if (token) return token;
    } catch {
      // Fall through to the stored token rather than failing the sync.
    }
  }
  return SecureStore.getItemAsync(CLERK_TOKEN_KEY);
}

/** Resolve the current Clerk session token (live supplier, then stored JWT). */
export async function getClerkSupabaseToken(): Promise<string | null> {
  return getClerkSupabaseTokenInternal();
}

/**
 * True once a live Clerk token supplier is wired and Supabase is configured.
 */
export function isAuthBridgeLive(): boolean {
  return tokenSupplier !== null && supabase !== null;
}

/**
 * Apply (or clear) the Clerk session token on the Supabase client. Safe no-op
 * when Supabase isn't configured. If the token is not accepted (Supabase JWT
 * issuer not set up), RLS-relevant queries surface an auth error downstream.
 */
export async function applyClerkSupabaseToken(token: string | null): Promise<void> {
  if (!supabase) return;
  if (token) {
    await supabase.auth
      .setSession({ access_token: token, refresh_token: '' })
      .catch(() => undefined);
  } else {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }
}

export async function fetchWithClerkToken<T>(op: (token: string | null) => Promise<T>): Promise<T> {
  return op(await getClerkSupabaseTokenInternal());
}

export { supabase };
