import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors, Fonts, Shadows, Spacing } from '@/constants/theme';
import type { MockMatch } from '@/mocks/items';

type MatchCardProps = {
  match: MockMatch;
  onThisIsMine?: (match: MockMatch) => void;
  onNotMine?: (match: MockMatch) => void;
};

/**
 * Full-width match card (mockup .match-card): photo banner, amber
 * "Possible Match" tag, title, category, location, date, and the
 * This-is-mine / Not-mine pair.
 */
export function MatchCard({ match, onThisIsMine, onNotMine }: MatchCardProps) {
  return (
    <View style={styles.card}>
      {match.photo ? (
        <Image source={match.photo} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <ThemedText style={styles.placeholderGlyph}>📦</ThemedText>
        </View>
      )}
      <ThemedText style={styles.tag}>⌕ Possible Match</ThemedText>
      <ThemedText style={styles.title}>{match.title}</ThemedText>
      <ThemedText style={styles.meta}>{match.category}</ThemedText>
      <ThemedText style={styles.meta}>{match.location}</ThemedText>
      <ThemedText style={styles.meta}>
        Found {match.foundDate} · {match.foundTime}
      </ThemedText>
      <Button
        label="✓  This is mine"
        variant="navy"
        onPress={() => onThisIsMine?.(match)}
        style={styles.button}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => onNotMine?.(match)}
        style={({ pressed }) => [styles.notMine, pressed && { opacity: 0.6 }]}
      >
        <ThemedText style={styles.notMineText}>Not mine</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: Spacing.two + 2,
    padding: Spacing.two,
    ...Shadows.card,
  },
  photo: {
    borderRadius: 11,
    height: 150,
    marginBottom: Spacing.two,
    width: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    justifyContent: 'center',
  },
  placeholderGlyph: {
    fontSize: 34,
  },
  tag: {
    color: '#ad7726',
    fontFamily: Fonts.dm.bold,
    fontSize: 11,
    marginHorizontal: Spacing.two,
    marginTop: 2,
  },
  title: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 16,
    letterSpacing: 0,
    marginHorizontal: Spacing.two,
    marginTop: 3,
  },
  meta: {
    color: Colors.light.textSecondary,
    fontSize: 11,
    marginHorizontal: Spacing.two,
    marginTop: 3,
  },
  button: {
    height: 44,
    marginHorizontal: Spacing.two,
    marginTop: Spacing.two + 1,
    width: undefined,
  },
  notMine: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  notMineText: {
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
});
