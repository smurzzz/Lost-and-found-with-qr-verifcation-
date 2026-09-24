/**
 * Success — v3 port (SuccessScreen). Handles both found-item posted and
 * claim submitted variants.
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Check } from 'lucide-react-native';

import { Colors, Fonts, Shadows } from '@/constants/design';
import { Button3, StatusPill } from '@/components/v3/core';
import { V3Screen } from '@/components/v3/screen';

export default function FoundSuccessScreen() {
  const found = true;

  return (
    <V3Screen>
      <View style={styles.wrap}>
        <View style={[styles.check, Shadows.float]}>
          <Check size={48} strokeWidth={2.5} color={Colors.success} />
        </View>
        <Text style={styles.title}>{found ? 'Found item posted' : 'Claim Submitted'}</Text>
        <Text style={styles.text}>
          {found
            ? 'This item is now visible to other students. Please drop it off with staff to complete verification.'
            : "Your claim has been sent to staff for verification. If approved, staff will scan the item's QR tag before releasing it to you."}
        </Text>
        {found ? (
          <View style={styles.pill}>
            <StatusPill status="dropoff" />
          </View>
        ) : null}
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
  pill: { marginTop: 20, alignItems: 'center' },
  button: { alignSelf: 'stretch', marginTop: 36 },
});
