import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

/**
 * Entry route (Phase 3): resolves the signed-in user's role and routes to the
 * correct home. Not signed in / no users row → /login. Splash stays up until
 * the session settles so there's no flash of the wrong screen.
 *
 * Sign-in race (07-PROGRESS-TRACKER): after Google sign-in the Supabase
 * session activates before the users-row sync completes, so `role` can briefly
 * be null while `isSignedIn` is already true. We hold the splash in that
 * window instead of redirecting to /login.
 */
export default function IndexScreen() {
  const { isLoaded, isSignedIn, user, role, syncError } = useSession();

  if (!isLoaded) {
    return null;
  }
  if (!isSignedIn || !user) {
    return <Redirect href="/login" />;
  }
  if (syncError) {
    // Sync/RLS failure (staff not provisioned, JWT not accepted) — show on login.
    return <Redirect href="/login" />;
  }
  if (!role) {
    // Signed in but the users-row sync is still running — keep the splash up.
    return null;
  }
  return <Redirect href={role === 'staff' ? '/(staff)/dashboard' : '/(student)/home'} />;
}
