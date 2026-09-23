import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StaffCard } from '@/components/ui/staff-card';
import { StaffNav, type StaffTab } from '@/components/ui/staff-nav';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { mockFoundItems } from '@/mocks/items';
import { mockPendingClaims, mockStudentReports } from '@/mocks/staff';

/**
 * Staff Dashboard (09-FUNCTIONALITY-PROMPT.md §7): summary cards, three
 * switchable tabs, actionable staff cards, and the floating "Log Found Item"
 * button. Visuals follow assets/staff-dashboard.webp + the prototype CSS.
 */
type TabKey = 'found' | 'claims' | 'reports';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'found', label: 'Found Items' },
  { key: 'claims', label: 'Pending Claims' },
  { key: 'reports', label: 'Student Reports' },
];

/** Mockup summary numbers (Phase 6 replaces with live counts). */
const summary = [
  { value: '12', label: 'Found items' },
  { value: '3', label: 'Pending claims' },
  { value: '2', label: 'Student reports' },
];

export default function StaffDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('reports');

  const goStaff = (tab: StaffTab) => {
    if (tab === 'home') return;
    router.push(`/(staff)/${tab}`);
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Topbar */}
          <View style={styles.topbar}>
            <ThemedText style={styles.topbarTitle}>Staff Dashboard</ThemedText>
            <View style={[styles.avatar, styles.orangeAvatar]}>
              <ThemedText style={styles.avatarText}>ST</ThemedText>
            </View>
          </View>

          {/* Summary cards */}
          <View style={styles.summary}>
            {summary.map((card) => (
              <View key={card.label} style={styles.summaryCard}>
                <ThemedText style={styles.summaryValue}>{card.value}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.summaryLabel}>
                  {card.label}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Tabs */}
          <View style={styles.tabRow} accessibilityRole="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={tab.label}
                  onPress={() => setActiveTab(tab.key)}
                  style={styles.tabItem}
                >
                  <ThemedText style={[styles.tab, isActive && styles.tabActive]}>
                    {tab.label}
                  </ThemedText>
                  {isActive && <View style={styles.tabUnderline} />}
                </Pressable>
              );
            })}
          </View>

          {/* Section header + cards for the active tab */}
          <View style={styles.sectionTitle}>
            <ThemedText style={styles.sectionTitleText}>{sectionTitle[activeTab].label}</ThemedText>
            <StatusBadge
              label={sectionTitle[activeTab].badge}
              tone={sectionTitle[activeTab].tone}
            />
          </View>
          <View style={styles.cardList}>{renderCards(activeTab, router)}</View>

          {/* Floating add */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log Found Item"
            onPress={() => router.push('/(staff)/log-found')}
            style={({ pressed }) => [styles.floatingAdd, pressed && { opacity: 0.85 }]}
          >
            <ThemedText style={styles.floatingAddText}>＋ Log Found Item</ThemedText>
          </Pressable>
        </ScrollView>

        <StaffNav active="home" onSelect={goStaff} />
      </SafeAreaView>
    </ThemedView>
  );
}

/** Section headers per tab — the mockup shows "Needs confirmation · 2 pending". */
const sectionTitle: Record<TabKey, { label: string; badge: string; tone: 'amber' | 'green' }> = {
  found: { label: 'Available for claim', badge: '5 items', tone: 'green' },
  claims: { label: 'Awaiting verification', badge: '2 claims', tone: 'amber' },
  reports: { label: 'Needs confirmation', badge: '2 pending', tone: 'amber' },
};

function renderCards(tab: TabKey, router: ReturnType<typeof useRouter>) {
  if (tab === 'reports') {
    return mockStudentReports.map((report) => (
      <StaffCard
        key={report.id}
        status={report.status === 'pending_dropoff' ? 'Pending drop-off' : 'QR tag ready'}
        statusTone={report.status === 'pending_dropoff' ? 'amber' : 'green'}
        title={report.title}
        meta={[`Reported by ${report.reporter}`, `⌖ ${report.location} · ${report.reportedAt}`]}
        actionLabel={report.status === 'pending_dropoff' ? 'Confirm Receipt' : 'View QR Tag'}
        onAction={() =>
          router.push(
            report.status === 'pending_dropoff'
              ? `/(staff)/confirm-receipt?reportId=${report.id}`
              : `/(staff)/qr-tag?itemId=${report.itemId ?? ''}`,
          )
        }
      />
    ));
  }

  if (tab === 'claims') {
    return mockPendingClaims.map((claim) => (
      <StaffCard
        key={claim.id}
        icon="⌾"
        status="Claim received"
        statusTone="amber"
        title={claim.itemTitle}
        meta={[`Claimed by ${claim.claimant}`, `“${claim.detailPreview}”`, `◷ ${claim.claimedAt}`]}
        actionLabel="Review Claim"
        onAction={() => router.push('/(staff)/audit')}
      />
    ));
  }

  return mockFoundItems.map((item) => (
    <StaffCard
      key={item.id}
      status={item.status === 'pending_dropoff' ? 'Pending drop-off' : 'Available'}
      statusTone={item.status === 'pending_dropoff' ? 'amber' : 'green'}
      title={item.title}
      meta={[item.category, `⌖ ${item.location} · ${item.foundDate}, ${item.foundTime}`]}
      actionLabel={item.status === 'pending_dropoff' ? 'Confirm Receipt' : 'View QR Tag'}
      onAction={() =>
        router.push(
          item.status === 'pending_dropoff'
            ? `/(staff)/confirm-receipt?itemId=${item.id}`
            : `/(staff)/qr-tag?itemId=${item.id}`,
        )
      }
    />
  ));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.lavender,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
    paddingHorizontal: Spacing.two + 7,
    paddingTop: Spacing.two,
  },

  // Topbar
  topbar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  topbarTitle: {
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.light.text,
    borderRadius: Radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  orangeAvatar: {
    backgroundColor: Colors.light.orange,
  },
  avatarText: {
    color: '#ffffff',
    fontFamily: Fonts.dm.bold,
    fontSize: 11,
  },

  // Summary
  summary: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: 4,
  },
  summaryValue: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },

  // Tabs
  tabRow: {
    borderBottomColor: Colors.light.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  tabItem: {
    minWidth: 48,
  },
  tab: {
    color: Colors.light.textSecondary,
    fontFamily: Fonts.dm.medium,
    fontSize: 11,
    paddingBottom: Spacing.two,
  },
  tabActive: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.bold,
  },
  tabUnderline: {
    backgroundColor: Colors.light.orange,
    borderRadius: Radius.pill,
    height: 2,
    marginBottom: -1,
  },

  // Section
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sectionTitleText: {
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
  },
  cardList: {
    gap: 0,
  },

  // Floating add
  floatingAdd: {
    alignItems: 'center',
    backgroundColor: Colors.light.orange,
    borderRadius: Radius.pill,
    marginTop: Spacing.three,
    minHeight: 44,
    justifyContent: 'center',
    ...Shadows.float,
  },
  floatingAddText: {
    color: '#ffffff',
    fontFamily: Fonts.dm.bold,
    fontSize: 13,
  },
});
