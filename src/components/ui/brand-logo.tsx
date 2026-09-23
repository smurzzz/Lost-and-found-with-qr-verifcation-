import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius } from '@/constants/theme';

type BrandLogoProps = {
  /** Overall scale; 1 matches the login mockup (~15px text, 18px mark). */
  scale?: number;
};

/**
 * ClaimIt wordmark: rounded-square QR mark (navy with orange dot) + "ClaimIt"
 * in Plus Jakarta Sans ExtraBold with the orange "It", per the mockups.
 */
export function BrandLogo({ scale = 1 }: BrandLogoProps) {
  const mark = Math.round(18 * scale);
  const dot = Math.max(4, Math.round(6 * scale));

  return (
    <View style={styles.row}>
      <View style={[styles.mark, { width: mark, height: mark, borderRadius: mark * 0.28 }]}>
        <View style={[styles.dot, { width: dot, height: dot }]} />
      </View>
      <ThemedText style={styles.wordmark}>
        Claim<ThemedText style={styles.wordmarkAccent}>It</ThemedText>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: Colors.light.text,
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: Colors.light.orange,
    borderRadius: Radius.sm,
  },
  wordmark: {
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: Math.round(17 * 1),
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  wordmarkAccent: {
    color: Colors.light.orange,
  },
});
