import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Colors, Fonts, Radius } from '@/constants/theme';

export type StatusTone = 'neutral' | 'amber' | 'green' | 'navy' | 'danger';

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  /** Leading Feather line icon (mockup badges: ⌕ Possible Match, ⏱ Pending). */
  icon?: React.ComponentProps<typeof Icon>['name'];
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
 * paired with a text label. V2 mockups show pill badges with a leading line
 * icon; icon stays optional for compact list usages.
 */
export function StatusBadge({ label, tone = 'neutral', icon }: StatusBadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={13} color={t.fg} />
        </View>
      ) : null}
      <ThemedText style={[styles.label, { color: t.fg }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconWrap: {
    paddingTop: 1,
  },
  label: {
    fontFamily: Fonts.dm.bold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
