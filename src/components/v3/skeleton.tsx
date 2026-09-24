/**
 * v3 loading skeletons — §1.4 "empty states and loading-skeleton visuals
 * built now so Phase 2+ just has to trigger them." Simple opacity-pulse
 * placeholders matching the item card / stat card / row layouts.
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Shadows } from '@/constants/design';

function usePulse() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((value) => !value), 700);
    return () => clearInterval(id);
  }, []);
  return on ? 1 : 0.45;
}

export function SkeletonBox({ style }: { style?: object }) {
  const opacity = usePulse();
  return <View style={[{ backgroundColor: Colors.muted, borderRadius: 8, opacity }, style]} />;
}

/** Matches ItemCard's layout (image + title + meta + location). */
export function ItemCardSkeleton() {
  const opacity = usePulse();
  return (
    <View style={[styles.card, Shadows.card, { opacity }]}>
      <View style={styles.image} />
      <View style={styles.body}>
        <SkeletonBox style={styles.title} />
        <SkeletonBox style={styles.meta} />
        <SkeletonBox style={styles.location} />
      </View>
    </View>
  );
}

/** Matches the staff dashboard's three stat cards. */
export function StatRowSkeleton() {
  const opacity = usePulse();
  return (
    <View style={styles.statRow}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={[styles.statCard, Shadows.card, { opacity }]}>
          <SkeletonBox style={styles.statValue} />
          <SkeletonBox style={styles.statLabel} />
        </View>
      ))}
    </View>
  );
}

/** Generic list row (claims, notifications). */
export function RowSkeleton() {
  const opacity = usePulse();
  return (
    <View style={[styles.row, Shadows.card, { opacity }]}>
      <SkeletonBox style={styles.rowIcon} />
      <View style={styles.rowText}>
        <SkeletonBox style={styles.rowTitle} />
        <SkeletonBox style={styles.rowMeta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  image: {
    aspectRatio: 1.9 / 1,
    backgroundColor: Colors.muted,
  },
  body: { padding: 16, gap: 10 },
  title: { height: 16, width: '55%' },
  meta: { height: 12, width: '40%' },
  location: { height: 14, width: '70%', marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  statCard: {
    flex: 1,
    borderRadius: Radius.input,
    backgroundColor: Colors.card,
    padding: 12,
  },
  statValue: { height: 24, width: '45%' },
  statLabel: { height: 10, width: '80%', marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 16,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 12 },
  rowText: { flex: 1, gap: 8 },
  rowTitle: { height: 14, width: '60%' },
  rowMeta: { height: 11, width: '85%' },
});
