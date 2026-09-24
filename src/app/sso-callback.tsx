/**
 * OAuth redirect callback (web only).
 *
 * The web Google flow is a full-page redirect (not a popup — Google's COOP
 * headers block the popup `window.closed` handshake), so after Google the
 * browser lands here with `?sso=...` state in the URL. `handleRedirectCallback`
 * verifies the state, activates the session and navigates to the fallback
 * URL. Native (iOS/Android) never touches this route — it uses the
 * expo-web-browser flow from the login screen.
 */

import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useClerk } from '@clerk/expo';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';

export default function SsoCallbackScreen() {
  const clerk = useClerk();
  // StrictMode/QR double-mounts the effect — run the handshake once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    clerk
      .handleRedirectCallback({ signInFallbackRedirectUrl: '/' })
      .catch(() => router.replace('/login'));
  }, [clerk]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color={Colors.light.orange} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        Finishing sign-in…
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: Colors.light.lavender,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  note: {
    fontFamily: Fonts.dm.medium,
  },
});
