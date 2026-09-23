import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getEnv } from '@/lib/env';

/**
 * ClaimIt's single Supabase client. Per 06-LIBRARY-DOCS.md: initialized once
 * here, never per-component. Auth uses Clerk session tokens (wired in Phase 3),
 * so Supabase Auth is disabled — Row-Level Security still applies to the anon
 * role once we pass Clerk JWTs in the Authorization header.
 *
 * With placeholder keys (Phase 0, pre-0.4) we create a placeholder-mode client:
 * all calls are no-ops until real values are filled into .env.
 */
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
        // Supabase Auth is not used; Clerk owns identity (02-ARCHITECTURE.md §1).
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

/**
 * Phase 0 smoke test: a trivial read against the items table.
 * Succeeds if the table exists (even empty) — an RLS-permitted empty scan or a
 * "table missing" code both prove URL/key/env wiring is correct. Schema and
 * policies arrive in Phase 2.
 */
export async function verifySupabaseConnection(): Promise<boolean> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured yet — fill EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (see Phase 0 task 0.4), then restart.',
    );
  }
  const { error } = await supabase.from('items').select('id').limit(1);
  if (error && error.code === 'PGRST205') {
    // Table not found = connectivity + auth OK; tables are created in Phase 2.
    return true;
  }
  if (error && error.code !== '42501') {
    // 42501 = RLS blocked the anon read, which still proves the connection works.
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  return true;
}
