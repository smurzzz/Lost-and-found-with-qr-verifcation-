import { Stack } from 'expo-router';

/**
 * Staff route group — Phase 1 static screens (08-PHASE-PLAN.md §1.2).
 * Dashboard is the first screen; Scan/Audit/Profile and the item-flow
 * screens land with their mockups.
 */
export default function StaffLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="audit" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="log-found" />
      <Stack.Screen name="confirm-receipt" />
      <Stack.Screen name="qr-tag" />
    </Stack>
  );
}
