import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomNav, type NavTab } from '@/components/ui/bottom-nav';
import { Button } from '@/components/ui/button';
import { CategoryChip } from '@/components/ui/category-chip';
import { ItemCard } from '@/components/ui/item-card';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { itemCategories, mockFoundItems, type ItemCategory, type MockItem } from '@/mocks/items';

type MockUser = {
  name: string;
  initials: string;
  avatar: number;
};

const mockUser: MockUser = {
  name: 'Alex',
  initials: 'AM',
  avatar: require('@/assets/items/student.avif'),
};

/**
 * Student Home (09-FUNCTIONALITY-PROMPT.md §2) — Phase 1 static build.
 * Mock feed, client-side category filter, Mine/Not mine only toggling local
 * state or navigating (08-PHASE-PLAN.md §1.2). Real data lands in Phase 6.
 * Visuals: assets/student-home.webp + prototype CSS (.topbar/.searchbox/...).
 */
export default function StudentHomeScreen() {
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'All'>('All');
  const [query, setQuery] = useState('');
  const [queryFocused, setQueryFocused] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockFoundItems.filter((item) => {
      if (dismissedIds.has(item.id)) return false;
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      if (q && !`${item.title} ${item.location}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [activeCategory, dismissedIds, query]);

  const handleNotMine = (item: MockItem) => {
    setDismissedIds((prev) => new Set(prev).add(item.id));
  };

  const handleMine = (item: MockItem) => {
    router.push({
      pathname: '/(student)/claim-verify',
      params: { itemId: item.id },
    });
  };

  const handleNavSelect = (tab: NavTab) => {
    // Phase 1.4 wires all tab routes; for now only Profile has a target.
    if (tab === 'profile') {
      router.push('/(student)/profile');
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top bar: wordmark + avatar (mockup .topbar) */}
        <View style={styles.topbar}>
          <ThemedText style={styles.wordmark}>
            claim<ThemedText style={styles.wordmarkAccent}>it</ThemedText>
          </ThemedText>
          <Image source={mockUser.avatar} style={styles.avatar} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.greeting}>Good morning, {mockUser.name}</ThemedText>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Find your{'\n'}
            <ThemedText style={styles.pageTitleAccent}>lost item</ThemedText>
          </ThemedText>

          {/* Search box (mockup .searchbox): tap to focus, type to filter */}
          <Pressable
            accessibilityRole="search"
            style={styles.searchbox}
            onPress={() => setQueryFocused(true)}
          >
            <ThemedText style={styles.searchGlyph}>⌕</ThemedText>
            {queryFocused || query ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search found items..."
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.searchInput}
                autoFocus
                onBlur={() => setQueryFocused(false)}
              />
            ) : (
              <ThemedText style={styles.searchPlaceholder}>Search found items...</ThemedText>
            )}
            <ThemedText style={styles.searchScan}>⌑</ThemedText>
          </Pressable>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsRow}
            contentContainerStyle={styles.chipsContent}
          >
            {itemCategories.map((category) => (
              <CategoryChip
                key={category}
                label={category}
                active={activeCategory === category}
                onPress={() => setActiveCategory(category)}
              />
            ))}
          </ScrollView>

          {/* Section header */}
          <View style={styles.sectionTitle}>
            <ThemedText style={styles.sectionTitleText}>Found items</ThemedText>
            <Pressable accessibilityRole="link">
              <ThemedText style={styles.seeAll}>See all</ThemedText>
            </Pressable>
          </View>

          {/* Feed */}
          {visibleItems.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyGlyph}>⌕</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                No items here yet. Try another category or clear the search.
              </ThemedText>
            </View>
          ) : (
            visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onThisIsMine={handleMine}
                onNotMine={handleNotMine}
              />
            ))
          )}

          {/* Report buttons (mockup .home-buttons) */}
          <View style={styles.homeButtons}>
            <Button
              label="＋ Report lost"
              variant="orange"
              onPress={() => router.push('/(student)/report-lost')}
              style={styles.homeButton}
            />
            <Button
              label="＋ Report found"
              variant="light"
              onPress={() => router.push('/(student)/report-found')}
              style={styles.homeButton}
            />
          </View>
        </ScrollView>

        <BottomNav active="home" onSelect={handleNavSelect} />
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
  wordmark: {
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: 17,
    letterSpacing: 0,
  },
  wordmarkAccent: {
    color: Colors.light.orange,
  },
  avatar: {
    borderRadius: Radius.pill,
    height: 34,
    width: 34,
  },
  scrollContent: {
    paddingBottom: 96,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.half,
  },
  greeting: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 30,
    lineHeight: 32,
    marginBottom: Spacing.two + 2,
  },
  pageTitleAccent: {
    color: Colors.light.accent,
  },

  searchbox: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    height: 46,
    paddingHorizontal: Spacing.two + 3,
    ...Shadows.card,
  },
  searchGlyph: {
    color: Colors.light.textSecondary,
    fontSize: 15,
  },
  searchPlaceholder: {
    color: Colors.light.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  searchInput: {
    color: Colors.light.text,
    flex: 1,
    fontFamily: Fonts.dm.regular,
    fontSize: 13,
    padding: 0,
  },
  searchScan: {
    color: Colors.light.text,
    fontSize: 16,
  },

  chipsRow: {
    flexGrow: 0,
    marginTop: Spacing.two + 2,
  },
  chipsContent: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },

  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
    marginTop: Spacing.two + 2,
    paddingHorizontal: 2,
  },
  sectionTitleText: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
  },
  seeAll: {
    color: Colors.light.accent,
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
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
    fontSize: 22,
  },

  homeButtons: {
    flexDirection: 'row',
    gap: Spacing.xs + 1,
    marginTop: Spacing.two + 3,
  },
  homeButton: {
    flex: 1,
    height: 44,
  },
});
