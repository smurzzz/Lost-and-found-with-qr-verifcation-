/**
 * ClaimIt's single Supabase client. Per 06-LIBRARY-DOCS.md: initialized once
 * here, never per-component. Supabase RLS is enforced by tokens issued via
 * Clerk's `supabase` JWT template (see authBridge). The client is created with
 * placeholder keys until real values exist in .env (Phase 0).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
        // Session lifecycle is owned by Clerk (authBridge): we apply the Clerk
        // `supabase` template JWT on demand, so Supabase must not try to
        // auto-refresh its own session or persist one.
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
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
