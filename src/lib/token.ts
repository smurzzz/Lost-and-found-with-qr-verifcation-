/**
 * Access-token helper (typed-api layer + diagnostics).
 * The Supabase client mints a fresh Clerk session token per request via the
 * module-level getter (authBridge); this reads the same source for callers
 * outside the client (e.g. error diagnostics).
 */

import { fetchSessionToken } from '@/lib/authBridge';

export async function getSupabaseAccessToken(): Promise<string | null> {
  return fetchSessionToken();
}
