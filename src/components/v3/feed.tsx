/**
 * ClaimIt v3 feed components — ItemCard, SearchBox, and Feed. Ported 1:1
 * from the Lovable source (claimit-app.tsx).
 */

import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MapPin, QrCode, Search } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, ChipButton, StatusPill } from '@/components/v3/core';
import { categories, items, type MockItem } from '@/mocks/data';

/* ------------------------------------------------------------------ */
/* ItemCard                                                            */
/* ------------------------------------------------------------------ */

export function ItemCard({
  item,
  staff = false,
  onMine,
  onDismiss,
  onOpen,
}: {
  item: MockItem;
  staff?: boolean;
  onMine?: () => void;
  onDismiss?: () => void;
  onOpen?: () => void;
}) {
  return (
    <View style={[styles.card, Shadows.card]}>
      <Pressable onPress={onOpen} accessibilityLabel={`View ${item.name}`}>
        <View style={styles.imageWrap}>
          <Image source={item.image} style={styles.image} />
          <View style={styles.pillOverlay}>
            <StatusPill status={item.status} />
          </View>
          {staff ? (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{item.source}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cardMeta}>
              {item.category} · {item.date}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color={Colors.mutedForeground} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>
          {staff && item.status !== 'dropoff' ? <QrCode size={20} color={Colors.success} /> : null}
        </View>
        {!staff && item.status !== 'released' ? (
          <View style={styles.actionRow}>
            <View style={styles.actionButton}>
              <Button3 label="Mine" height={44} onPress={onMine} />
            </View>
            <View style={styles.actionButton}>
              <Button3 label="Not mine" variant="secondary" height={44} onPress={onDismiss} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* SearchBox                                                           */
/* ------------------------------------------------------------------ */

export function SearchBox({
  query,
  onQuery,
  placeholder = 'Search found items...',
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.searchWrap}>
      <Search size={20} color={Colors.mutedForeground} style={styles.searchIcon} />
      <TextInput
        value={query}
        onChangeText={onQuery}
        placeholder={placeholder}
        placeholderTextColor={Colors.mutedForeground}
        style={styles.searchInput}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Feed                                                                */
/* ------------------------------------------------------------------ */

export function Feed({
  staff = false,
  searchOnly = false,
  onMine,
}: {
  staff?: boolean;
  searchOnly?: boolean;
  onMine: () => void;
}) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          !dismissed.includes(item.id) &&
          (category === 'All' || item.category === category) &&
          item.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [category, dismissed, query],
  );

  return (
    <View>
      <View style={styles.feedSearch}>
        <SearchBox query={query} onQuery={setQuery} />
      </View>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {categories.map((name) => (
            <ChipButton
              key={name}
              label={name}
              active={category === name}
              onPress={() => setCategory(name)}
            />
          ))}
        </ScrollView>
      </View>
      {searchOnly ? (
        <Text style={styles.resultCount}>{visible.length} items found</Text>
      ) : (
        <View style={styles.feedHeading}>
          <Text style={styles.feedHeadingTitle}>Found Items</Text>
          <Text style={styles.feedHeadingMeta}>Newest first</Text>
        </View>
      )}
      <View style={styles.feedList}>
        {visible.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            staff={staff}
            onMine={onMine}
            onDismiss={() => setDismissed((current) => [...current, item.id])}
          />
        ))}
        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={36} color={Colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyText}>Try another category or search.</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
  },
  imageWrap: {
    aspectRatio: 1.9 / 1,
    backgroundColor: Colors.muted,
  },
  image: { width: '100%', height: '100%' },
  pillOverlay: { position: 'absolute', left: 12, top: 12 },
  sourceBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sourceText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  cardBody: { padding: 16 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTextWrap: { flex: 1, minWidth: 0 },
  cardName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.mutedForeground,
  },
  locationRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.secondaryForeground,
  },
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: { flex: 1 },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
  },
  searchInput: {
    height: 56,
    borderRadius: Radius.input,
    backgroundColor: Colors.card,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.foreground,
    ...Shadows.card,
  },
  feedSearch: { paddingHorizontal: 16 },
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  feedHeading: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedHeadingTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  feedHeadingMeta: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.mutedForeground,
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.mutedForeground,
  },
  feedList: { gap: 16, paddingHorizontal: 16 },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.mutedForeground,
  },
});
