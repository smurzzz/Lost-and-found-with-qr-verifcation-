import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { isSupabaseConfigured, verifySupabaseConnection } from '@/lib/supabase';

type Status = 'idle' | 'checking' | 'ok' | 'fail';

/**
 * Phase 0 verify screen (08-PHASE-PLAN.md §0.7).
 * • Navigation shell renders (expo-router stack).
 * • "Verify Supabase" runs a trivial query against the items table to prove
 *   the env vars / URL / anon key are wired correctly.
 * • "Clerk auth wiring" link opens the login screen, which renders inside
 *   ClerkProvider — proving the auth provider loads.
 * Phase 1 replaces this with the real Student Home.
 */
export default function HomeScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const runCheck = async () => {
    setStatus('checking');
    setMessage('');
    try {
      const ok = await verifySupabaseConnection();
      setStatus(ok ? 'ok' : 'fail');
      setMessage(
        ok
          ? 'Supabase reachable — env vars are wired correctly.'
          : 'Unexpected response from Supabase.',
      );
    } catch (e) {
      setStatus('fail');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">ClaimIt</ThemedText>
        <ThemedText type="small">
          Phase 0 scaffold — Expo SDK 57 · expo-router · TypeScript strict
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <ThemedText type="subtitle">Environment checks</ThemedText>
          {!isSupabaseConfigured() && (
            <ThemedText type="small" themeColor="textSecondary">
              ⏳ Supabase keys not set yet — add them to .env (Phase 0 task 0.4) and restart to
              enable the live smoke test.
            </ThemedText>
          )}
          <ThemedText type="small">
            {status === 'checking'
              ? 'Checking Supabase…'
              : status === 'ok'
                ? '✅ Supabase connected'
                : status === 'fail'
                  ? `❌ ${message}`
                  : 'Run the Supabase smoke test, then open the login screen to verify Clerk wiring.'}
          </ThemedText>

          {status === 'checking' ? (
            <ActivityIndicator />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={runCheck}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <ThemedText type="linkPrimary">Verify Supabase</ThemedText>
            </Pressable>
          )}

          <Link href="/login" asChild>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <ThemedText type="link">Open Clerk login screen →</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: 800,
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  button: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.6,
  },
});
