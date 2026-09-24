import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

/**
 * Entry route (Phase 3): resolves the signed-in user's role and routes to the
 * correct home. Not signed in / no users row → /login. Splash stays up until
 * the session settles so there's no flash of the wrong screen.
 */
export default function IndexScreen() {
  const { isLoaded, isSignedIn, role } = useSession();

  if (!isLoaded) {
    return null;
  }
  if (!isSignedIn || !role) {
    return <Redirect href="/login" />;
  }
  return <Redirect href={role === 'staff' ? '/(staff)/dashboard' : '/(student)/home'} />;
}
