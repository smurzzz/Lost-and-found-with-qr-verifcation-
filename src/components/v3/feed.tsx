/**
 * ClaimIt v3 feed components — ItemCard, SearchBox, and Feed. Ported 1:1
 * from the Lovable source (claimit-app.tsx).
 */

import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MapPin, PackageCheck, QrCode, Search, Sparkles } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, ChipButton, StatusPill, type PillStatus } from '@/components/v3/core';
import { ItemCardSkeleton } from '@/components/v3/skeleton';
import { useDebouncedValue } from '@/lib/hooks/use-debounce';
import { formatFoundDate } from '@/lib/dates';
import type { ItemRow, LostReportRow } from '@/lib/db';
import { categories, items, type MockItem } from '@/mocks/data';

/** DB item status → pill variant (claimed items show as the released state). */
export const itemStatusToPill: Record<ItemRow['status'], PillStatus> = {
  pending_dropoff: 'dropoff',
  available: 'unclaimed',
  pending_claim: 'pending',
  claimed: 'released',
};

/** Lost-report status → (pill variant, copy). */
const lostStatusToPill: Record<LostReportRow['status'], { status: PillStatus; label: string }> = {
  searching: { status: 'unclaimed', label: 'Searching' },
  possible_match: { status: 'pending', label: 'Possible match' },
  claimed: { status: 'released', label: 'Claimed' },
  closed: { status: 'dropoff', label: 'Closed' },
};

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

/** DB ItemRow card for the staff dashboard (real data, no photo asset). */
export function StaffItemCard({ item, onOpen }: { item: ItemRow; onOpen?: () => void }) {
  return (
    <View style={[styles.card, Shadows.card]}>
      <Pressable onPress={onOpen} accessibilityLabel={`View ${item.title}`}>
        <View style={styles.imageWrap}>
          <View style={styles.dashPlaceholder}>
            <View style={styles.dashPlaceholderIcon}>
              <PackageCheck size={34} color={Colors.card} />
            </View>
          </View>
          <View style={styles.pillOverlay}>
            <StatusPill status={itemStatusToPill[item.status]} />
          </View>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>
              {item.source === 'student_reported' ? 'Reported by student' : 'Logged by staff'}
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta}>
              {item.category} · {formatFoundDate(item.found_date)}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color={Colors.mutedForeground} />
              <Text style={styles.locationText}>{item.found_location}</Text>
            </View>
          </View>
          {item.status !== 'claimed' ? <QrCode size={20} color={Colors.success} /> : null}
        </View>
        {item.qr_code ? (
          <View style={styles.qrCodePill}>
            <Text style={styles.qrCodeText}>{item.qr_code}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** DB ItemRow card for the student feed (real data, Phase 6) — Mine / Not mine. */
export function StudentItemCard({
  item,
  onMine,
  onDismiss,
}: {
  item: ItemRow;
  onMine: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={[styles.card, Shadows.card]}>
      <View style={styles.imageWrap}>
        <View style={styles.dashPlaceholder}>
          <View style={styles.dashPlaceholderIcon}>
            <PackageCheck size={34} color={Colors.card} />
          </View>
        </View>
        <View style={styles.pillOverlay}>
          <StatusPill status={itemStatusToPill[item.status]} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta}>
              {item.category} · {formatFoundDate(item.found_date)}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={16} color={Colors.mutedForeground} />
              <Text style={styles.locationText}>{item.found_location}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionRow}>
          <View style={styles.actionButton}>
            <Button3 label="Mine" height={44} onPress={onMine} />
          </View>
          <View style={styles.actionButton}>
            <Button3 label="Not mine" variant="secondary" height={44} onPress={onDismiss} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** A signed-in student's lost-report card (student home "My Lost Reports"). */
export function LostReportCard({ report }: { report: LostReportRow }) {
  const pill = lostStatusToPill[report.status];
  return (
    <View style={[styles.lostReportCard, Shadows.card]}>
      <View style={styles.lostReportIcon}>
        <Sparkles size={20} color={Colors.pendingForeground} />
      </View>
      <View style={styles.lostReportTextWrap}>
        <Text style={styles.lostReportName} numberOfLines={1}>
          {report.category}
        </Text>
        <Text style={styles.lostReportMeta} numberOfLines={1}>
          Reported {formatFoundDate(report.created_at, false)} · {report.lost_location}
        </Text>
      </View>
      <StatusPill status={pill.status} label={pill.label} />
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
  dbItems,
  dbLoading = false,
}: {
  staff?: boolean;
  searchOnly?: boolean;
  onMine: (itemId: string) => void;
  /** Real ItemRows (Phase 6). When provided, the mock feed is skipped. */
  dbItems?: ItemRow[];
  dbLoading?: boolean;
}) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [dismissed, setDismissed] = useState<string[]>([]);
  // §1.4: skeleton visuals exist now; Phase 2 swaps the timeout for the real fetch.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(id);
  }, []);

  const isDb = dbItems !== undefined;

  // §2: debounce the search term (~300ms) as the user types.
  const debouncedQuery = useDebouncedValue(query, 300).toLowerCase().trim();

  const mockVisible = useMemo(
    () =>
      items.filter(
        (item) =>
          !dismissed.includes(item.id) &&
          (category === 'All' || item.category === category) &&
          (item.name.toLowerCase().includes(debouncedQuery) ||
            item.category.toLowerCase().includes(debouncedQuery)),
      ),
    [category, debouncedQuery, dismissed],
  );

  // Real feed: search on title/description + category chips, all client-side;
  // claimed items are hidden (one item, one owner — the release flow owns the
  // claimed transition). pending_dropoff items stay visible with their
  // "Pending drop-off" badge per the design.
  const dbVisible = useMemo(
    () =>
      (dbItems ?? []).filter(
        (item) =>
          !dismissed.includes(item.id) &&
          item.status !== 'claimed' &&
          (category === 'All' || item.category === category) &&
          (item.title.toLowerCase().includes(debouncedQuery) ||
            item.description.toLowerCase().includes(debouncedQuery)),
      ),
    [category, dbItems, debouncedQuery, dismissed],
  );

  const visibleCount = isDb ? dbVisible.length : mockVisible.length;
  const resultsLoading = isDb ? dbLoading : loading;

  function renderResults() {
    if (resultsLoading) {
      return [0, 1, 2].map((index) => <ItemCardSkeleton key={index} />);
    }
    if (isDb) {
      return dbVisible.map((item) => (
        <StudentItemCard
          key={item.id}
          item={item}
          onMine={() => onMine(item.id)}
          onDismiss={() => setDismissed((current) => [...current, item.id])}
        />
      ));
    }
    return mockVisible.map((item) => (
      <ItemCard
        key={item.id}
        item={item}
        staff={staff}
        onMine={() => onMine(item.id)}
        onDismiss={() => setDismissed((current) => [...current, item.id])}
      />
    ));
  }

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
        <Text style={styles.resultCount}>{visibleCount} items found</Text>
      ) : (
        <View style={styles.feedHeading}>
          <Text style={styles.feedHeadingTitle}>Found Items</Text>
          <Text style={styles.feedHeadingMeta}>Newest first</Text>
        </View>
      )}
      <View style={styles.feedList}>
        {renderResults()}
        {visibleCount === 0 && !resultsLoading ? (
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
  dashPlaceholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashPlaceholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodePill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qrCodeText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  lostReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 16,
  },
  lostReportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.pendingSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lostReportTextWrap: { flex: 1, minWidth: 0 },
  lostReportName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  lostReportMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
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
