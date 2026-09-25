/**
 * Staff Dashboard — v3 port (StaffHome). Stats row, three tabs, a floating
 * "+" for Log Found Item, and per-tab content (items / student report / claims).
 *
 * Phase 4: the Found Items tab + first stat read real items via
 * useFoundItems (demo mode falls back to the Phase 1 mocks).
 * Phase 7: the Pending Claims tab + stat read real claims via usePendingClaims.
 * Phase 8: the Student Reports tab + stat read real pending_dropoff items via
 * useStudentReports, and each card opens Confirm Receipt with its item id.
 * Users tab: staff/admin directory — RLS returns every users row for staff
 * (students only ever see their own), so this lists students and staff alike.
 * §7: the three summary counts are scoped to "This week" — the trailing 7
 * days keyed on `created_at`; the lists themselves are not windowed. Scan is
 * reachable directly from the bottom nav.
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight, FileText, Plus, Users } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, Header } from '@/components/v3/core';
import { ItemCard, StaffItemCard } from '@/components/v3/feed';
import { ItemCardSkeleton } from '@/components/v3/skeleton';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { useFoundItems, useStudentReports } from '@/lib/hooks/use-items';
import { useAllUsers } from '@/lib/hooks/use-users';
import { usePendingClaims } from '@/lib/hooks/use-claims';
import type { UserRole, UserRow } from '@/lib/db';
import { initialsOf, useSession } from '@/lib/session';
import { items, staffPendingClaims } from '@/mocks/data';

const tabs = ['Found Items', 'Student Reports', 'Pending Claims', 'Users'];

// Summary counts are scoped to "This week": the trailing 7 days from now,
// keyed on `created_at`. The lists themselves are not windowed.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function withinLastWeek(createdAt?: string | null, now = Date.now()): boolean {
  return Boolean(createdAt) && now - new Date(createdAt as string).getTime() <= WEEK_MS;
}

export default function StaffDashboardScreen() {
  const [tab, setTab] = useState('Found Items');
  const role = 'staff' as const;
  const { isDemo, dbUser } = useSession();
  const found = useFoundItems({ enabled: !isDemo });
  const pendingClaims = usePendingClaims({ enabled: !isDemo });
  const studentReports = useStudentReports({ enabled: !isDemo });
  const allUsers = useAllUsers({ enabled: !isDemo });
  const realUsers = allUsers.data ?? [];
  const realPendingClaims = pendingClaims.data ?? [];
  const realStudentReports = studentReports.data ?? [];

  const studentReport = items.find((item) => item.status === 'dropoff');
  const realItems = found.data ?? [];
  const foundCount = isDemo
    ? items.length
    : realItems.filter((item) => withinLastWeek(item.created_at)).length;
  const claimsCount = isDemo
    ? staffPendingClaims.length
    : realPendingClaims.filter((claim) => withinLastWeek(claim.created_at)).length;
  const reportsCount = isDemo
    ? items.filter((item) => item.status === 'dropoff').length
    : realStudentReports.filter((item) => withinLastWeek(item.created_at)).length;
  const avatarText = dbUser?.name ? initialsOf(dbUser.name) : 'JS';

  const foundList = isDemo ? (
    items.map((item) => <ItemCard key={item.id} item={item} staff />)
  ) : found.isLoading ? (
    [0, 1, 2].map((index) => <ItemCardSkeleton key={index} />)
  ) : found.isError ? (
    <View style={styles.listError}>
      <Text style={styles.listErrorTitle}>Couldn&apos;t load items</Text>
      <Text style={styles.listErrorMessage}>
        {found.error instanceof Error ? found.error.message : 'The feed is unavailable right now.'}
      </Text>
      <View style={styles.listErrorButton}>
        <Button3 label="Retry" variant="outline" height={44} onPress={() => void found.refetch()} />
      </View>
    </View>
  ) : realItems.length === 0 ? (
    <View style={styles.listError}>
      <Text style={styles.listErrorTitle}>No items yet</Text>
      <Text style={styles.listErrorMessage}>Log the first found item to see it here.</Text>
    </View>
  ) : (
    realItems.map((item) => <StaffItemCard key={item.id} item={item} />)
  );

  const usersList = isDemo ? (
    <View style={styles.listError}>
      <Text style={styles.listErrorTitle}>Users</Text>
      <Text style={styles.listErrorMessage}>
        The directory loads from the database in real (non-demo) mode.
      </Text>
    </View>
  ) : allUsers.isLoading ? (
    <View style={styles.listError}>
      <Text style={styles.listErrorTitle}>Loading users…</Text>
    </View>
  ) : allUsers.isError ? (
    <View style={styles.listError}>
      <Text style={styles.listErrorTitle}>Couldn&apos;t load users</Text>
      <Text style={styles.listErrorMessage}>
        {allUsers.error instanceof Error
          ? allUsers.error.message
          : 'The directory is unavailable right now.'}
      </Text>
      <View style={styles.listErrorButton}>
        <Button3
          label="Retry"
          variant="outline"
          height={44}
          onPress={() => void allUsers.refetch()}
        />
      </View>
    </View>
  ) : realUsers.length === 0 ? (
    <View style={styles.listError}>
      <Text style={styles.listErrorTitle}>No users yet</Text>
      <Text style={styles.listErrorMessage}>People appear here after their first sign-in.</Text>
    </View>
  ) : (
    realUsers.map((user) => <UserRowCard key={user.id} user={user} />)
  );

  return (
    <V3Screen
      nav={
        <BottomNav3
          role={role}
          active="staff-home"
          onSelect={(t) => router.push(tabRoute(role, t))}
        />
      }
      floating={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log Found Item"
          style={({ pressed }) => [styles.fab, Shadows.brand, pressed && styles.fabPressed]}
          onPress={() => router.push('/(staff)/log-found')}
        >
          <Plus size={24} color={Colors.primaryForeground} />
        </Pressable>
      }
    >
      <Header
        title="Staff Dashboard"
        action={
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>
        }
      />

      <View style={styles.stats}>
        {[
          { value: String(foundCount), label: 'Found Items' },
          { value: String(reportsCount), label: 'Student Reports' },
          { value: String(claimsCount), label: 'Pending Claims' },
        ].map(({ value, label }) => (
          <View key={label} style={[styles.statCard, Shadows.card]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statCaption}>This week</Text>
          </View>
        ))}
      </View>

      <View>
        <View style={styles.tabRow}>
          {tabs.map((name) => (
            <Pressable
              key={name}
              onPress={() => setTab(name)}
              style={[styles.tab, tab === name ? styles.tabActive : null]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === name ? Colors.primaryForeground : Colors.foreground },
                ]}
              >
                {name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.list}>
        {tab === 'Found Items' ? foundList : null}
        {tab === 'Student Reports' ? (
          isDemo ? (
            studentReport ? (
              <ItemCard
                item={studentReport}
                staff
                onOpen={() => router.push('/(staff)/confirm-receipt')}
              />
            ) : null
          ) : studentReports.isLoading ? (
            [0, 1, 2].map((index) => <ItemCardSkeleton key={index} />)
          ) : studentReports.isError ? (
            <View style={styles.listError}>
              <Text style={styles.listErrorTitle}>Couldn&apos;t load student reports</Text>
              <Text style={styles.listErrorMessage}>
                {studentReports.error instanceof Error
                  ? studentReports.error.message
                  : 'Student reports are unavailable right now.'}
              </Text>
              <View style={styles.listErrorButton}>
                <Button3
                  label="Retry"
                  variant="outline"
                  height={44}
                  onPress={() => void studentReports.refetch()}
                />
              </View>
            </View>
          ) : realStudentReports.length === 0 ? (
            <View style={styles.listError}>
              <Text style={styles.listErrorTitle}>No student reports</Text>
              <Text style={styles.listErrorMessage}>
                Items students are dropping off appear here for confirmation.
              </Text>
            </View>
          ) : (
            realStudentReports.map((item) => (
              <StaffItemCard
                key={item.id}
                item={item}
                onOpen={() =>
                  router.push({
                    pathname: '/(staff)/confirm-receipt',
                    params: { itemId: item.id },
                  })
                }
              />
            ))
          )
        ) : null}
        {tab === 'Pending Claims' ? (
          isDemo ? (
            staffPendingClaims.map((claim, index) => (
              <Pressable
                key={claim.name}
                style={[styles.claimCard, Shadows.card]}
                onPress={() => router.push('/(staff)/scan')}
              >
                <View style={styles.claimIcon}>
                  <FileText size={20} color={Colors.pendingForeground} />
                </View>
                <View style={styles.claimText}>
                  <Text style={styles.claimName} numberOfLines={1}>
                    {claim.name}
                  </Text>
                  <Text style={styles.claimDetail} numberOfLines={1}>
                    “{index === 0 ? staffPendingClaims[0].detail : staffPendingClaims[1].detail}”
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.mutedForeground} />
              </Pressable>
            ))
          ) : pendingClaims.isLoading ? (
            <View style={styles.listError}>
              <Text style={styles.listErrorTitle}>Loading pending claims…</Text>
            </View>
          ) : pendingClaims.isError ? (
            <View style={styles.listError}>
              <Text style={styles.listErrorTitle}>Couldn&apos;t load claims</Text>
              <Text style={styles.listErrorMessage}>
                {pendingClaims.error instanceof Error
                  ? pendingClaims.error.message
                  : 'Pending claims are unavailable right now.'}
              </Text>
              <View style={styles.listErrorButton}>
                <Button3
                  label="Retry"
                  variant="outline"
                  height={44}
                  onPress={() => void pendingClaims.refetch()}
                />
              </View>
            </View>
          ) : realPendingClaims.length === 0 ? (
            <View style={styles.listError}>
              <Text style={styles.listErrorTitle}>No pending claims</Text>
              <Text style={styles.listErrorMessage}>
                Claims submitted by students appear here for verification.
              </Text>
            </View>
          ) : (
            realPendingClaims.map((claim) => {
              const name = claim.claimant?.name ?? 'Unknown student';
              const title = claim.item?.title ?? 'Unknown item';
              return (
                <Pressable
                  key={claim.id}
                  style={[styles.claimCard, Shadows.card]}
                  onPress={() => router.push('/(staff)/scan')}
                >
                  <View style={styles.claimIcon}>
                    <FileText size={20} color={Colors.pendingForeground} />
                  </View>
                  <View style={styles.claimText}>
                    <Text style={styles.claimName} numberOfLines={1}>
                      {name} · {title}
                    </Text>
                    <Text style={styles.claimDetail} numberOfLines={1}>
                      “{claim.verification_answer}”
                    </Text>
                  </View>
                  <ChevronRight size={20} color={Colors.mutedForeground} />
                </Pressable>
              );
            })
          )
        ) : null}
        {tab === 'Users' ? usersList : null}
      </View>
    </V3Screen>
  );
}

const roleBadgeStyles: Record<UserRole, object> = {
  student: { backgroundColor: Colors.muted },
  staff: { backgroundColor: Colors.primarySoft },
  admin: { backgroundColor: Colors.pendingSoft },
};

/** One row of the staff Users directory (name, email, role badge). */
function UserRowCard({ user }: { user: UserRow }) {
  return (
    <View style={[styles.userCard, Shadows.card]}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{initialsOf(user.name)}</Text>
      </View>
      <View style={styles.userText}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      <View style={[styles.userRoleBadge, roleBadgeStyles[user.role]]}>
        <Text style={styles.userRoleText}>{user.role}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 16,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  userText: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  userEmail: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  userRoleBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  userRoleText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
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
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.primaryForeground,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.input,
    backgroundColor: Colors.card,
    padding: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: Colors.mutedForeground,
  },
  statCaption: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    opacity: 0.85,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  tab: {
    height: 36,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  list: { gap: 16, paddingHorizontal: 16, paddingTop: 16 },
  claimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 16,
  },
  claimIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.pendingSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: { flex: 1, minWidth: 0 },
  claimName: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  claimDetail: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  listError: {
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 24,
    alignItems: 'center',
  },
  listErrorTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  listErrorMessage: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: Colors.mutedForeground,
  },
  listErrorButton: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
