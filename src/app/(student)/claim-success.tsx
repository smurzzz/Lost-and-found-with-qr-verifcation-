/**
 * Claim success — v3 port (SuccessScreen, claim variant).
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Check } from 'lucide-react-native';

import { Colors, Fonts, Shadows } from '@/constants/design';
import { Button3 } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';

export default function ClaimSuccessScreen() {
  return (
    <V3Screen
      nav={
        <BottomNav3
          role="student"
          active="home"
          onSelect={(tab) => router.push(tabRoute('student', tab))}
        />
      }
    >
      <View style={styles.wrap}>
        <View style={[styles.check, Shadows.float]}>
          <Check size={48} strokeWidth={2.5} color={Colors.success} />
        </View>
        <Text style={styles.title}>Claim Submitted</Text>
        <Text style={styles.text}>
          Your claim has been sent to staff for verification. If approved, staff will scan the
          item&apos;s QR tag before releasing it to you.
        </Text>
        <Button3
          label="Back to Home"
          style={styles.button}
          onPress={() => router.push('/(student)/home')}
        />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  check: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: Colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 28,
    fontSize: 30,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
    textAlign: 'center',
  },
  text: {
    marginTop: 12,
    maxWidth: 380,
    fontSize: 14,
    lineHeight: 24,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  button: { alignSelf: 'stretch', marginTop: 36 },
});
