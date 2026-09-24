/**
 * users-table sync (Phase 3): on first login, ensure a `users` row exists for
 * the Clerk user. Student self-signup is domain-restricted; staff accounts are
 * invite-only (a staff row must already exist, seeded/provisioned by an admin).
 */

import { supabase } from '@/lib/supabase';
import type { UserRow, UserRole } from '@/lib/db';

/** School email domain enforced at signup (01-PROJECT-OVERVIEW.md). */
export const SCHOOL_DOMAIN = '@school.edu';

export class DomainError extends Error {
  constructor() {
    super('Only school email addresses (@school.edu) can sign up.');
    this.name = 'DomainError';
  }
}

export class StaffNotProvisionedError extends Error {
  constructor() {
    super('This staff account has not been provisioned yet. Ask an administrator.');
    this.name = 'StaffNotProvisionedError';
  }
}

export interface ClerkProfile {
  id: string;
  name: string;
  email: string;
}

/**
 * Ensure a users row exists for this Clerk user and return it with its role.
 * - Existing row  → return as-is (role decides routing).
 * - New student   → create with role 'student' if the email is on the school
 *                   domain; otherwise throw DomainError.
 * - New staff email without an existing row → StaffNotProvisionedError
 *   (invite-only provisioning; never self-created).
 */
export async function syncUserOnLogin(profile: ClerkProfile): Promise<UserRow> {
  if (!supabase) {
    throw new Error('Supabase is not configured (Phase 0 task 0.4).');
  }

  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('id', profile.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as UserRow;

  const isStaffEmail = !profile.email.toLowerCase().endsWith(SCHOOL_DOMAIN);
  if (isStaffEmail) {
    // Staff are invite-only: no self-service row creation.
    throw new StaffNotProvisionedError();
  }

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
  if (insertError) throw insertError;
  return created as UserRow;
}
