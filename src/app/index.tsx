import { Redirect } from 'expo-router';

/**
 * Entry route: Phase 1 click-through starts at Login (08-PHASE-PLAN.md §1.2).
 * Phase 3 replaces this with real session-based routing via Clerk.
 */
export default function IndexScreen() {
  return <Redirect href="/login" />;
}
