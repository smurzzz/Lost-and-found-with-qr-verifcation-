import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StaffNav } from '@/components/ui/staff-nav';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { mockAuditEvents, type MockAuditEvent } from '@/mocks/staff';

/**
 * Staff: Audit Log (09-FUNCTIONALITY-PROMPT.md §12) — Phase 1 static build.
 * One item's lifecycle timeline (mockup: Blue Canvas Backpack) with working
 * stage filters. Confirm Release on the Scan screen routes here. Real
 * event history from the DB lands in Phase 7.
 */

const filters = [
  { key: 'all', label: 'All' },
  { key: 'unclaimed', label: 'Unclaimed' },
  { key: 'pending_claim', label: 'Pending Claim' },
  { key: 'claimed', label: 'Claimed' },
] as const;

type FilterKey = (typeof filters)[number]['key'];

function TimelineDot({ event }: { event: MockAuditEvent }) {
  const bg =
    event.tone === 'green'
      ? Colors.light.green
      : event.tone === 'orange'
        ? Colors.light.orange
        : Colors.light.text;
  return (
    <View style={[styles.dot, { backgroundColor: bg }]}>
      {event.check ? <ThemedText style={styles.dotCheck}>✓</ThemedText> : null}
    </View>
  );
}

export default function StaffAuditScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const events = mockAuditEvents.filter((e) => filter === 'all' || e.stage === filter);

  const goStaff = (tab: 'home' | 'scan' | 'audit' | 'profile') => {
    if (tab === 'audit') return;
    router.push(tab === 'home' ? '/(staff)/dashboard' : `/(staff)/${tab}`);
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Topbar (mockup .topbar): back, title, menu */}
        <View style={styles.topbar}>
          <ThemedText
            accessibilityRole="button"
            style={styles.backGlyph}
            onPress={() => router.push('/(staff)/dashboard')}
          >
            ‹
          </ThemedText>
          <ThemedText style={styles.topbarTitle}>Audit Log</ThemedText>
          <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.kicker}>12 / STAFF FLOW</ThemedText>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Item history
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subcopy}>
            Blue Canvas Backpack · ID CLM-2048
          </ThemedText>

          {/* Stage filters (mockup .filters) */}
          <View style={styles.filters}>
            {filters.map((f) => {
              const isActive = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${f.label} filter`}
                  onPress={() => setFilter(f.key)}
                  style={[styles.filter, isActive && styles.filterActive]}
                >
                  <ThemedText style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Timeline (mockup .timeline) */}
          <View style={styles.timeline}>
            {events.map((event) => (
              <View key={event.id} style={styles.timelineRow}>
                <TimelineDot event={event} />
                <View style={styles.timelineBody}>
                  <View style={styles.titleRow}>
                    <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                    <ThemedText style={styles.eventTime}>{event.time}</ThemedText>
                  </View>
                  <ThemedText style={styles.eventDescription}>{event.description}</ThemedText>
                  <ThemedText style={styles.eventActor}>{event.actor}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <StaffNav active="audit" onSelect={goStaff} />
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
  menuGlyph: {
    color: Colors.light.text,
    fontSize: 18,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  scrollContent: {
    paddingBottom: 110,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.half,
  },
  kicker: {
    color: Colors.light.accent,
    fontFamily: Fonts.jakarta.bold,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 29,
    marginTop: Spacing.xs,
  },
  subcopy: {
    marginBottom: Spacing.two + 2,
    marginTop: Spacing.xs + 2,
  },

  // Filters (mockup .filters)
  filters: {
    flexDirection: 'row',
    gap: Spacing.one + 1,
    marginBottom: Spacing.three + 2,
    marginTop: Spacing.two,
  },
  filter: {
    borderColor: Colors.light.line,
    borderRadius: 7,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two + 1,
  },
  filterActive: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },
  filterText: {
    color: Colors.light.textSecondary,
    fontFamily: Fonts.dm.medium,
    fontSize: 11,
  },
  filterTextActive: {
    color: '#ffffff',
    fontFamily: Fonts.dm.bold,
  },

  // Timeline (mockup .timeline): connector line via border on each row
  timeline: {
    paddingLeft: 3,
    paddingTop: 3,
  },
  timelineRow: {
    borderLeftColor: '#d5d4e8',
    borderLeftWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 3,
    marginBottom: Spacing.four - 5,
    marginLeft: 6,
    paddingBottom: 0,
    paddingLeft: 0,
  },
  timelineBody: {
    flex: 1,
    gap: 3,
    paddingBottom: Spacing.four - 3,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  eventTitle: {
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  eventTime: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  eventDescription: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  eventActor: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },

  // Dot (mockup .dot)
  dot: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flexShrink: 0,
    height: 13,
    justifyContent: 'center',
    marginLeft: -7,
    marginTop: 3,
    width: 13,
    zIndex: 1,
  },
  dotCheck: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: Fonts.dm.bold,
  },
});
