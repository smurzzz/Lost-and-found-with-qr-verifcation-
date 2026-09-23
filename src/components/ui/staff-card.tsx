import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';

export type StaffCardProps = {
  /** Left rounded icon glyph (▣, ⌾, …) per the mockup's .staff-icon. */
  icon?: string;
  status: string;
  statusTone: StatusTone;
  title: string;
  /** Lines under the title: reporter, location · time. */
  meta: string[];
  actionLabel: string;
  onAction?: () => void;
};

/**
 * Staff list card (mockup .staff-card): rounded icon + status head, bold
 * title, meta lines, full-width outlined action button.
 */
export function StaffCard({
  icon = '▣',
  status,
  statusTone,
  title,
  meta,
  actionLabel,
  onAction,
}: StaffCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.iconWrap}>
          <ThemedText style={styles.iconGlyph}>{icon}</ThemedText>
        </View>
        <StatusBadge label={status} tone={statusTone} />
      </View>

      <ThemedText style={styles.title}>{title}</ThemedText>
      {meta.map((line) => (
        <ThemedText key={line} type="small" themeColor="textSecondary" style={styles.meta}>
          {line}
        </ThemedText>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
      >
        <ThemedText style={styles.actionText}>{actionLabel}&nbsp;&nbsp;→</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    ...Shadows.card,
  },
  cardHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: Radius.sm + 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconGlyph: {
    color: Colors.light.accent,
    fontSize: 17,
  },
  title: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  meta: {
    marginTop: 4,
  },
  action: {
    alignItems: 'center',
    borderColor: '#a5a5cf',
    borderRadius: Radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: Spacing.two + 2,
    minHeight: 44,
  },
  actionText: {
    color: '#555895',
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
  },
});
