/**
 * React Query hook for the staff Users tab. Reads all users rows — RLS
 * (`users_select_self`) returns every user for staff/admin and only the
 * caller's own row for students, so students never see this screen.
 */

import { useQuery } from '@tanstack/react-query';

import { fetchAllUsers } from '@/lib/db';

/** All users (staff/admin only), role then name ordered. */
export function useAllUsers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: fetchAllUsers,
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}
