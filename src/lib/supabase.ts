/**
 * ClaimIt's single Supabase client. Per 06-LIBRARY-DOCS.md: initialized once
 * here, never per-component. The client is created with placeholder keys
 * until real values exist in .env (Phase 0).
 *
 * Auth: official Clerk third-party integration — every request fetches a
 * fresh Clerk session token via the module-level `accessToken` callback
 * (registered by SessionProvider in authBridge). Supabase verifies it
 * against Clerk's JWKS (Authentication → Third-Party Auth) and resolves the
 * caller's role/sub from the claims; RLS keys off auth.jwt() ->> 'sub'.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { fetchSessionToken } from '@/lib/authBridge';
import { getEnv } from '@/lib/env';

function createSupabaseClient(): {
  client: SupabaseClient | null;
  isPlaceholder: boolean;
} {
  const env = getEnv();
  if (!env.isConfigured) {
    return { client: null, isPlaceholder: true };
  }
  return {
    client: createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        // Session lifecycle is owned by Clerk: the per-request accessToken
        // callback mints a fresh session token, so the built-in session
        // store must stay off.
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      // Official third-party-auth wiring: fresh token on EVERY request
      // (Clerk session tokens are short-lived; a cached one degrades to
      // anon after expiry and RLS starts rejecting writes).
      accessToken: async () => {
        try {
          return await fetchSessionToken();
        } catch {
          return null;
        }
      },
    }),
    isPlaceholder: false,
  };
}

const { client, isPlaceholder } = createSupabaseClient();

/** The Supabase client. Null until real keys are set in .env (task 0.4). */
export const supabase = client;

export function isSupabaseConfigured(): boolean {
  return !isPlaceholder;
}
