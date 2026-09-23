import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomNav, type NavTab } from '@/components/ui/bottom-nav';
import { MatchCard } from '@/components/ui/match-card';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { mockMatches, type MockMatch } from '@/mocks/items';

/**
 * Possible Matches (09-FUNCTIONALITY-PROMPT.md §5) — Phase 1 static build.
 * Mock matched subset against the demo student's lost report; Not mine
 * dismisses the card locally. Deep-link highlight and real matching arrive
 * in Phase 6. Visuals: assets/possible-matches.webp + prototype CSS.
 */
export default function MatchesScreen() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleMatches = mockMatches.filter((m) => !dismissedIds.has(m.id));

  const handleNotMine = (match: MockMatch) => {
    setDismissedIds((prev) => new Set(prev).add(match.id));
  };

  const handleMine = (match: MockMatch) => {
    router.push({
      pathname: '/(student)/claim-verify',
      params: { matchId: match.id },
    });
  };

  const handleNavSelect = (tab: NavTab) => {
    if (tab === 'home') router.replace('/(student)/home');
    if (tab === 'profile') router.push('/(student)/profile');
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topbar}>
          <ThemedText
            accessibilityRole="button"
            style={styles.backGlyph}
            onPress={() => router.back()}
          >
            ‹
          </ThemedText>
          <ThemedText style={styles.topbarTitle}>Possible Matches</ThemedText>
          <ThemedText style={styles.bellGlyph}>♧</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Alert line (mockup .alert-line) */}
          <View style={styles.alertLine}>
            <ThemedText style={styles.alertText}>✦ New possible matches found</ThemedText>
            <ThemedText style={styles.alertTime}>2 min ago</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subcopy}>
            We found items that may match your lost report.
          </ThemedText>

          {visibleMatches.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyGlyph}>⌕</ThemedText>
              <ThemedText style={styles.emptyTitle}>No possible matches yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyCopy}>
                We&apos;ll notify you as soon as a found item matches one of your lost reports.
              </ThemedText>
            </View>
          ) : (
            visibleMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onThisIsMine={handleMine}
                onNotMine={handleNotMine}
              />
            ))
          )}
        </ScrollView>

        <BottomNav active="notifications" onSelect={handleNavSelect} />
      </SafeAreaView>
    </ThemedView>
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
  topbar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  backGlyph: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.regular,
    fontSize: 30,
    lineHeight: 34,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  topbarTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
  },
  bellGlyph: {
    color: Colors.light.text,
    fontSize: 17,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  scrollContent: {
    paddingBottom: 96,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.half,
  },
  alertLine: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two + 3,
  },
  alertText: {
    color: '#54558f',
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
  },
  alertTime: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  subcopy: {
    marginBottom: Spacing.two + 2,
    marginTop: Spacing.xs + 2,
  },

  emptyState: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.four,
  },
  emptyGlyph: {
    color: Colors.light.textSecondary,
    fontSize: 24,
  },
  emptyTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 15,
  },
  emptyCopy: {
    textAlign: 'center',
  },
});
