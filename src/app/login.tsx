import { useAuth } from '@clerk/expo';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getEnv } from '@/lib/env';

/**
 * Phase 0 auth wiring check. With a real publishable key (task 0.4) this
 * screen renders inside ClerkProvider and reports live session state, proving
 * the auth provider loads. The real SSO flow (useSSO, domain allowlist, role
 * routing) lands in Phase 3 per 08-PHASE-PLAN.md.
 */
export default function LoginScreen() {
  const clerkConfigured = Boolean(getEnv().clerkPublishableKey);

  if (!clerkConfigured) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.card}>
          <ThemedText type="title">ClaimIt</ThemedText>
          <ThemedText type="small">
            ⏳ Clerk is not configured yet. Fill EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env (Phase 0
            task 0.4), then restart the dev server.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return <ClerkLoginShell />;
}

/** Rendered only when Clerk is configured, so useAuth is always valid here. */
function ClerkLoginShell() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="title">ClaimIt</ThemedText>
        <ThemedText type="small">
          {isLoaded
            ? isSignedIn
              ? '✅ Clerk loaded — a session is active.'
              : '✅ Clerk loaded — no active session (sign-in arrives in Phase 3).'
            : 'Loading Clerk…'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    gap: Spacing.two,
    alignItems: 'center',
  },
});
