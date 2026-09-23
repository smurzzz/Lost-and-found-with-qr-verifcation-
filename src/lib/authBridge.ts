import * as SecureStore from 'expo-secure-store';

import { CLERK_TOKEN_KEY } from '@/constants/keys';
import { supabase } from '@/lib/supabase';

/**
 * Bridge between Clerk (identity) and Supabase (data).
 * Phase 0 ships the plumbing with a no-op token supplier; Phase 3 replaces it
 * with the real Clerk session-token fetch. Keep the async signature stable so
 * nothing else changes when that lands.
 */
async function getClerkSupabaseToken(): Promise<string | null> {
  // TODO(Phase 3): return clerk.session.getToken() instead of the stored token.
  return SecureStore.getItemAsync(CLERK_TOKEN_KEY);
}

/**
 * True once a real Clerk token supplier is wired (always false in Phase 0).
 * Used by screens to decide whether Supabase calls should be attempted.
 */
export function isAuthBridgeLive(): boolean {
  return false;
}

export async function fetchWithClerkToken<T>(op: (token: string | null) => Promise<T>): Promise<T> {
  return op(await getClerkSupabaseToken());
}

export { supabase };
