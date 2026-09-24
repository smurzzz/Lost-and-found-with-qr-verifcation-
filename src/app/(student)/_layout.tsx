import { Stack } from 'expo-router';

/**
 * Student route group — v3 screens. Each screen renders its own v3 header
 * and bottom nav, so native headers stay hidden.
 */
export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="search" />
      <Stack.Screen name="report" />
      <Stack.Screen name="report-lost" />
      <Stack.Screen name="report-found" />
      <Stack.Screen name="found-success" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="claim-verify" />
      <Stack.Screen name="claim-success" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
