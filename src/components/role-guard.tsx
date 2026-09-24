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
  const { isLoaded, isSignedIn, role } = useSession();

  if (!isLoaded) {
    return null; // Splash stays up until the session settles.
  }
  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }
  if (!role) {
    // Signed in but no users row: staff-not-provisioned or sync failure.
    return <Redirect href="/login" />;
  }
  if (!allow.includes(role as 'student' | 'staff')) {
    return <Redirect href={role === 'staff' ? '/(staff)/dashboard' : '/(student)/home'} />;
  }
  return <>{children}</>;
}
