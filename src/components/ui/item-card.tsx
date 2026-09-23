import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shadows, Spacing } from '@/constants/theme';
import type { MockItem } from '@/mocks/items';
import { StatusBadge } from '@/components/ui/status-badge';

type ItemCardProps = {
  item: MockItem;
  onThisIsMine?: (item: MockItem) => void;
  onNotMine?: (item: MockItem) => void;
};

/**
 * Feed card for a found item (mockup .mini-item): 70px photo, title,
 * category · location, date · time, and Mine / Not mine actions.
 */
export function ItemCard({ item, onThisIsMine, onNotMine }: ItemCardProps) {
  return (
    <View style={styles.card}>
      {item.photo ? (
        <Image source={item.photo} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <ThemedText style={styles.placeholderGlyph}>📦</ThemedText>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {item.title}
          </ThemedText>
          {item.status === 'pending_dropoff' && (
            <StatusBadge label="Pending drop-off" tone="amber" />
          )}
        </View>
        <ThemedText style={styles.meta} numberOfLines={1}>
          {item.category} · {item.location}
        </ThemedText>
        <ThemedText style={styles.meta}>
          {item.foundDate} · {item.foundTime}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => onThisIsMine?.(item)} hitSlop={6}>
            <ThemedText style={styles.mineAction}>✓ This is mine</ThemedText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onNotMine?.(item)} hitSlop={6}>
            <ThemedText style={styles.notMineAction}>Not mine</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 1,
    marginBottom: Spacing.two,
    padding: Spacing.two,
    ...Shadows.card,
  },
  photo: {
    borderRadius: 10,
    height: 70,
    width: 70,
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    justifyContent: 'center',
  },
  placeholderGlyph: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  title: {
    flexShrink: 1,
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
    letterSpacing: 0,
  },
  meta: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two + 3,
    marginTop: 2,
  },
  mineAction: {
    color: '#57599c',
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
  },
  notMineAction: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
  },
});
