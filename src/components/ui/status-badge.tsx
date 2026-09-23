import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius } from '@/constants/theme';

export type StatusTone = 'neutral' | 'amber' | 'green' | 'navy' | 'danger';

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const tones: Record<StatusTone, { bg: string; fg: string }> = {
  neutral: { bg: '#eeeef8', fg: '#676891' },
  amber: { bg: Colors.light.orangeSoft, fg: '#a16b1d' },
  green: { bg: Colors.light.greenSoft, fg: '#0b8762' },
  navy: { bg: Colors.light.text, fg: '#ffffff' },
  danger: { bg: '#fbeaec', fg: Colors.light.danger },
};

/**
 * Single source of status styling (03-CODE-STANDARDS.md §4): color is always
 * paired with a text label. Maps to item/claim/report statuses app-wide.
 */
export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <ThemedText style={[styles.label, { color: t.fg }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  label: {
    fontFamily: Fonts.dm.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
