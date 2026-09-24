/**
 * Notifications — v3 port (Notifications). Two cards: matches alert
 * (navigates to matches) and verified report.
 */

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Header } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';

export default function NotificationsScreen() {
  return (
    <V3Screen
      nav={
        <BottomNav3
          role="student"
          active="notifications"
          onSelect={(tab) => router.push(tabRoute('student', tab))}
        />
      }
    >
      <Header title="Notifications" subtitle="Updates about your reports and claims" />
      <View style={styles.list}>
        <Pressable
          style={[styles.card, Shadows.card]}
          onPress={() => router.push('/(student)/matches')}
        >
          <View style={[styles.cardIcon, { backgroundColor: Colors.pendingSoft }]}>
            <Sparkles size={20} color={Colors.pendingForeground} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>2 possible matches found</Text>
            <Text style={styles.cardBody}>
              We found items that may match your white headphones.
            </Text>
            <Text style={styles.cardTime}>5 minutes ago</Text>
          </View>
          <ChevronRight size={20} color={Colors.mutedForeground} />
        </Pressable>

        <View style={[styles.card, Shadows.card]}>
          <View style={[styles.cardIcon, { backgroundColor: Colors.successSoft }]}>
            <ShieldCheck size={20} color={Colors.success} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Your report is now verified</Text>
            <Text style={styles.cardBody}>Staff received and tagged the green water bottle.</Text>
          </View>
        </View>
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, paddingHorizontal: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 16,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  cardBody: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  cardTime: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
});
