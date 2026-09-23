import { Stack } from 'expo-router';

/**
 * Student route group — Phase 1 static screens. Tabs arrive with the full
 * navigation pass (08-PHASE-PLAN.md §1.4); for now a plain stack so the
 * login → home flow works.
 */
export default function StudentLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false, title: 'Student Home' }} />
    </Stack>
  );
}
