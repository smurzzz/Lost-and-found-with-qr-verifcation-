/**
 * Student Home — v3 port from the Lovable source (StudentHome).
 * Greeting header, found-items feed, and My Lost Reports preview.
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Sparkles } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, StatusPill } from '@/components/v3/core';
import { Feed, LostReportCard } from '@/components/v3/feed';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { initialsOf, useSession } from '@/lib/session';
import { tabRoute } from '@/lib/v3-nav';
import { useMyLostReports } from '@/lib/hooks/use-reports';
import { useFoundItems } from '@/lib/hooks/use-items';
import { usePushTokenSync } from '@/lib/hooks/use-push-token';

export default function StudentHomeScreen() {
  const { dbUser, clerkUser, isDemo } = useSession();
  const name = dbUser?.name ?? clerkUser?.name ?? 'Alex Morgan';
  const firstName = name.trim().split(/\s+/)[0] || name;
  const initials = initialsOf(name);
  const lostReports = useMyLostReports(dbUser?.id, { enabled: !isDemo });
  const reports = lostReports.data ?? [];
  const foundItems = useFoundItems({ enabled: !isDemo });
  usePushTokenSync();

  const reportSection = (
    <View style={styles.reportsSection}>
      <View style={styles.reportsHeading}>
        <Text style={styles.reportsTitle}>My Lost Reports</Text>
        <Button3
          label="View matches"
          variant="link"
          height={32}
          style={styles.viewMatches}
          onPress={() => router.push('/(student)/matches')}
        />
      </View>
      {isDemo ? (
        <View style={[styles.reportCard, Shadows.card]}>
          <View style={styles.reportIcon}>
            <Sparkles size={20} color={Colors.pendingForeground} />
          </View>
          <View style={styles.reportTextWrap}>
            <Text style={styles.reportName}>White headphones</Text>
            <Text style={styles.reportMeta}>Reported Sep 21 · 2 possible matches</Text>
          </View>
          <StatusPill status="pending" />
        </View>
      ) : lostReports.isLoading ? (
        <View style={styles.reportEmpty}>
          <Text style={styles.reportEmptyText}>Loading your reports…</Text>
        </View>
      ) : lostReports.isError ? (
        <View style={styles.reportEmpty}>
          <Text style={styles.reportEmptyText}>Couldn&apos;t load your reports.</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.reportEmpty}>
          <Text style={styles.reportEmptyText}>
            No lost reports yet — tap Create a report to start.
          </Text>
        </View>
      ) : (
        reports.slice(0, 3).map((report) => <LostReportCard key={report.id} report={report} />)
      )}
    </View>
  );

  return (
    <V3Screen
      nav={
        <BottomNav3
          role="student"
          active="home"
          onSelect={(tab) => router.push(tabRoute('student', tab))}
        />
      }
    >
      <View style={styles.topBar}>
        <View style={styles.topBarText}>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
          <Text style={styles.heading}>Find your lost item.</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <Feed
        staff={false}
        dbItems={isDemo ? undefined : foundItems.data}
        dbLoading={!isDemo && foundItems.isLoading}
        onMine={(itemId) =>
          router.push({ pathname: '/(student)/claim-verify', params: { itemId } })
        }
      />

      {reportSection}
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20,
  },
  topBarText: { flex: 1, minWidth: 0 },
  greeting: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.mutedForeground,
  },
  heading: {
    marginTop: 4,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primaryForeground,
  },
  reportsSection: { marginTop: 28, paddingHorizontal: 16 },
  reportsHeading: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportsTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  viewMatches: { paddingHorizontal: 0 },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 16,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.pendingSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTextWrap: { flex: 1, minWidth: 0 },
  reportName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  reportMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  reportEmpty: {
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 20,
    alignItems: 'center',
  },
  reportEmptyText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: Colors.mutedForeground,
  },
});
