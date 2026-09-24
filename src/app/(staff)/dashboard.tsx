/**
 * Staff Dashboard — v3 port (StaffHome). Stats row, three tabs, Log Found
 * Item button, and per-tab content (items / student report / claims).
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight, FileText, Plus } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, Header } from '@/components/v3/core';
import { ItemCard } from '@/components/v3/feed';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { items, staffPendingClaims } from '@/mocks/data';

const tabs = ['Found Items', 'Student Reports', 'Pending Claims'];

export default function StaffDashboardScreen() {
  const [tab, setTab] = useState('Found Items');
  const studentReport = items.find((item) => item.status === 'dropoff');
  const role = 'staff' as const;

  return (
    <V3Screen
      nav={
        <BottomNav3
          role={role}
          active="staff-home"
          onSelect={(t) => router.push(tabRoute(role, t))}
        />
      }
    >
      <Header
        title="Staff Dashboard"
        action={
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JS</Text>
          </View>
        }
      />

      <View style={styles.stats}>
        {[
          ['24', 'Found Items'],
          ['3', 'Student Reports'],
          ['6', 'Pending Claims'],
        ].map(([value, label]) => (
          <View key={label} style={[styles.statCard, Shadows.card]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
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

      <View style={styles.logButtonWrap}>
        <Button3
          label="Log Found Item"
          height={48}
          onPress={() => router.push('/(staff)/log-found')}
        >
          <Plus size={20} color={Colors.primaryForeground} />
        </Button3>
      </View>

      <View style={styles.list}>
        {tab === 'Found Items'
          ? items.map((item) => <ItemCard key={item.id} item={item} staff />)
          : null}
        {tab === 'Student Reports' && studentReport ? (
          <ItemCard
            item={studentReport}
            staff
            onOpen={() => router.push('/(staff)/confirm-receipt')}
          />
        ) : null}
        {tab === 'Pending Claims'
          ? staffPendingClaims.map((claim, index) => (
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
          : null}
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
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
  logButtonWrap: { paddingHorizontal: 16, paddingTop: 20 },
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
});
