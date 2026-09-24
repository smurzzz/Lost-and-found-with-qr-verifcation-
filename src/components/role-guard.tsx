/**
 * Role-based route guarding (Phase 3). Wrap a screen with <RoleGuard>
 * and it enforces the session rules:
 *  - not signed in            → /login
 *  - signed in, no users row  → /login (sync failed / staff not provisioned)
 *  - wrong role for the route → the correct role's home
 *  - ok                       → renders children
 */

import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

export function RoleGuard({
  allow,
  children,
}: {
  /** Roles allowed on this route. */
  allow: ('student' | 'staff')[];
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn, user, syncError, role } = useSession();

  if (!isLoaded) {
    return null; // Splash stays up until the session settles.
  }
  if (!isSignedIn || !user) {
    return <Redirect href="/login" />;
  }
  if (syncError) {
    // Sync failure (staff not provisioned, JWT not accepted) — show on login.
    return <Redirect href="/login" />;
  }
  if (!role) {
    // Signed in but the users-row sync is still running — hold instead of
    // bouncing to /login (an active session + a fresh sign-in attempt fails).
    return null;
  }
  if (!allow.includes(role as 'student' | 'staff')) {
    return <Redirect href={role === 'staff' ? '/(staff)/dashboard' : '/(student)/home'} />;
  }
  return <>{children}</>;
}
