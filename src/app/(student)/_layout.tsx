import { Stack } from 'expo-router';

/**
 * Student route group — Phase 1 static screens. Each screen renders its own
 * mockup-style topbar, so headers stay hidden.
 */
export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="report-lost" />
      <Stack.Screen name="report-found" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="claim-verify" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
