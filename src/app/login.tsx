import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Button } from '@/components/ui/button';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { getEnv } from '@/lib/env';

/**
 * Login / Onboarding (09-FUNCTIONALITY-PROMPT.md §1).
 * Phase 1: UI only — "Continue with SSO" navigates straight to Student Home
 * with mock data (08-PHASE-PLAN.md §1.2). Real Clerk SSO lands in Phase 3.
 * Visuals follow assets/login.webp and the prototype CSS (.login styles).
 */
export default function LoginScreen() {
  const clerkConfigured = Boolean(getEnv().clerkPublishableKey);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          alwaysBounceVertical={false}
        >
          <BrandLogo scale={1} />
          <LoginIllustration />

          <View style={styles.copyBlock}>
            <ThemedText style={styles.eyebrow}>WELCOME BACK</ThemedText>
            <ThemedText type="title" style={styles.heading}>
              Lost{'\n'}something?
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subcopy}>
              Found something? Let&apos;s get it back. Every item is tagged and verified by staff
              before release.
            </ThemedText>
          </View>

          <SecureQrCard />

          <Button
            label="Continue with SSO"
            icon="✓"
            variant="navy"
            onPress={() => router.replace('/(student)/home')}
          />

          <Button
            label="Staff sign in (demo)"
            variant="light"
            onPress={() => router.replace('/(staff)/dashboard')}
          />

          {!clerkConfigured && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.devNote}>
              Phase 1 preview — Clerk keys not set yet (task 0.4), so SSO goes straight to the mock
              Student Home.
            </ThemedText>
          )}

          <LegalFooter />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/** Concentric rings + key card + QR chip, from the mockup illustration. */
function LoginIllustration() {
  return (
    <View style={styles.illustration}>
      <View style={[styles.ring, styles.ringA]} />
      <View style={[styles.ring, styles.ringB]} />
      <View style={styles.keyCard}>
        <ThemedText style={styles.keyGlyph}>🔑</ThemedText>
      </View>
      <View style={styles.qrChip}>
        <ThemedText style={styles.qrChipText}>QR</ThemedText>
      </View>
    </View>
  );
}

/** White info card: "Secure QR verification" with QR glyph. */
function SecureQrCard() {
  return (
    <View style={styles.secureCard}>
      <View style={styles.secureIconWrap}>
        <ThemedText style={styles.secureIcon}>▣</ThemedText>
      </View>
      <View style={styles.secureCopy}>
        <ThemedText style={styles.secureTitle}>Secure QR verification</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          We&apos;ll use your organization login to securely verify your identity.
        </ThemedText>
      </View>
    </View>
  );
}

function LegalFooter() {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.legal}>
      By continuing, you agree to our{' '}
      <ThemedText style={styles.legalLink}>Terms of Service</ThemedText> and{' '}
      <ThemedText style={styles.legalLink}>Privacy Policy</ThemedText>
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.lavender,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },

  // Illustration
  illustration: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 235,
    justifyContent: 'center',
    marginVertical: Spacing.two,
    width: 260,
  },
  ring: {
    borderColor: 'rgba(107,107,175,0.20)',
    borderRadius: Radius.pill,
    borderWidth: 1,
    position: 'absolute',
  },
  ringA: {
    height: 190,
    width: 190,
  },
  ringB: {
    borderColor: 'rgba(245,166,35,0.30)',
    height: 132,
    width: 132,
  },
  keyCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 32,
    height: 104,
    justifyContent: 'center',
    transform: [{ rotate: '-18deg' }],
    width: 104,
    ...Shadows.card,
  },
  keyGlyph: {
    fontSize: 46,
    transform: [{ rotate: '18deg' }],
  },
  qrChip: {
    backgroundColor: Colors.light.orange,
    borderRadius: 9,
    bottom: 39,
    paddingVertical: 8,
    paddingHorizontal: 7,
    position: 'absolute',
    right: 36,
    transform: [{ rotate: '12deg' }],
  },
  qrChipText: {
    color: '#ffffff',
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: 11,
  },

  // Copy
  copyBlock: {
    alignItems: 'center',
    gap: 0,
    marginTop: Spacing.half,
  },
  eyebrow: {
    color: Colors.light.accent,
    fontFamily: Fonts.jakarta.bold,
    fontSize: 11,
    letterSpacing: 2,
  },
  heading: {
    fontSize: 38,
    lineHeight: 38,
    marginTop: 10,
    textAlign: 'center',
  },
  subcopy: {
    marginTop: 10,
    maxWidth: 300,
    textAlign: 'center',
  },

  // Secure QR card
  secureCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 2,
    marginTop: Spacing.two,
    padding: Spacing.two + 4,
    ...Shadows.card,
  },
  secureIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: Radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  secureIcon: {
    color: Colors.light.accent,
    fontSize: 22,
  },
  secureCopy: {
    flex: 1,
    gap: 2,
  },
  secureTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },

  devNote: {
    marginTop: Spacing.two,
    textAlign: 'center',
  },

  // Legal
  legal: {
    marginTop: 'auto',
    paddingTop: Spacing.four,
    textAlign: 'center',
  },
  legalLink: {
    color: Colors.light.orange,
    fontFamily: Fonts.dm.medium,
  },
});
