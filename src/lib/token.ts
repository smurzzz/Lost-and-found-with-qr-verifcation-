/**
 * Access-token helper for the Edge-Function wrappers (typed-api layer).
 * The Supabase client uses Clerk's `supabase` template JWT (set via authBridge)
 * as its access token. We read it directly from the Supabase client's session.
 */

import { supabase } from '@/lib/supabase';

export async function getSupabaseAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
