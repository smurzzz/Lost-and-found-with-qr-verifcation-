/**
 * Central access to EXPO_PUBLIC_* environment variables.
 * Metro inlines these from .env at bundle time (see metro.config.js).
 *
 * Phase 0 note: keys stay empty until 0.4 (Supabase + Clerk projects are
 * created with real accounts). We report what's missing instead of crashing,
 * so the app always boots; features check `getEnv().isConfigured` before use.
 */

export interface Env {
  supabaseUrl: string;
  supabaseAnonKey: string;
  clerkPublishableKey: string;
  /** All required vars present and non-empty. */
  isConfigured: boolean;
  /** Names of the vars still empty — surfaced in the UI, not a crash. */
  missingVars: string[];
}

export function getEnv(): Env {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

  const missing: string[] = [];
  if (!supabaseUrl.trim()) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey.trim()) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!clerkPublishableKey.trim()) missing.push('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');

  return {
    supabaseUrl,
    supabaseAnonKey,
    clerkPublishableKey,
    /** All three required vars present and non-empty. */
    isConfigured: missing.length === 0,
    /** Names of the vars still empty — surfaced in the UI, not a crash. */
    missingVars: missing,
  };
}
