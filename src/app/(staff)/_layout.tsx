import { Stack } from 'expo-router';

/**
 * Staff route group — v3 screens. Each screen renders its own v3 header
 * and bottom nav, so native headers stay hidden.
 */
export default function StaffLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="log-found" />
      <Stack.Screen name="confirm-receipt" />
      <Stack.Screen name="qr-tag" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="release" />
      <Stack.Screen name="released" />
      <Stack.Screen name="audit" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
