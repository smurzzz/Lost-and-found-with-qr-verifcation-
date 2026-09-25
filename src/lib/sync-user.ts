/**
 * users-table sync (Phase 3): on first login, ensure a `users` row exists for
 * the Clerk user id.
 *
 * Decisions (07-PROGRESS-TRACKER):
 *  - Students: ANY Google account self-registers as a student on first login.
 *    There is no domain allowlist — "all users can sign up via Google".
 *    Security is enforced by RLS (`users_insert_self`), which forces every
 *    authenticated insert to `role = 'student'`. The Clerk `supabase` template
 *    JWT (applied to the Supabase client via authBridge) carries
 *    `role: 'authenticated'` and `sub` = Clerk user id, so the insert policy
 *    resolves correctly.
 *  - Staff: invite-only. A staff `users` row must be seeded by an admin BEFORE
 *    first login (or upserted afterwards). `syncUserOnLogin` NEVER assigns
 *    'staff', so a future staff member who signs in first lands as a student
 *    until the admin upsert flips their row (then re-sign-in picks up 'staff').
 */

import { supabase } from '@/lib/supabase';
import type { UserRow, UserRole } from '@/lib/db';

export interface Profile {
  id: string;
  name: string;
  email: string;
  /** Clerk/Google profile photo, when the account has one. */
  imageUrl?: string | null;
}

/**
 * Ensure a users row exists for this user and return it with its role.
 * - Existing row  → return as-is (role decides routing, incl. seeded staff).
 * - New user      → create with role 'student' (any email; see RLS above).
 */
export async function syncUserOnLogin(profile: Profile): Promise<UserRow> {
  if (!supabase) {
    throw new Error('Supabase is not configured (Phase 0 task 0.4).');
  }

  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('id', profile.id)
    .maybeSingle();

  if (selectError) {
    // PostgrestError is not an `instanceof Error`, so wrap it with context —
    // otherwise session.tsx can't surface the real reason (e.g. the Clerk
    // `supabase` template missing its role claim) and falls back to a vague
    // "sync failed".
    throw new Error(`users look-up failed: ${selectError.message}`);
  }
  if (existing) return existing as UserRow;

  const insert = {
    id: profile.id,
    role: 'student' as UserRole,
    name: profile.name,
    email: profile.email,
  };
  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert(insert)
    .select('*')
    .single();
  if (insertError) {
    // Include the Postgres code/details (RLS violations are 42501) so the
    // login screen can show exactly which layer rejected the row.
    const extra = [
      insertError.details ? `details: ${insertError.details}` : null,
      insertError.hint ? `hint: ${insertError.hint}` : null,
      insertError.code ? `code: ${insertError.code}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
    throw new Error(`users insert failed: ${insertError.message}${extra ? ` (${extra})` : ''}`);
  }
  return created as UserRow;
}
