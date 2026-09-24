/**
 * Report chooser — v3 port (ReportChooser). Two big cards: Report Lost /
 * Report Found.
 */

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight, PackageCheck, Search } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Header } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';

export default function ReportChooserScreen() {
  return (
    <V3Screen
      nav={
        <BottomNav3
          role="student"
          active="report"
          onSelect={(tab) => router.push(tabRoute('student', tab))}
        />
      }
    >
      <Header
        title="Create a report"
        subtitle="What would you like to report?"
        onBack={() => router.push('/(student)/home')}
      />
      <View style={styles.cards}>
        <Pressable
          style={[styles.card, Shadows.card]}
          onPress={() => router.push('/(student)/report-lost')}
        >
          <View style={[styles.cardIcon, { backgroundColor: Colors.primarySoft }]}>
            <Search size={28} color={Colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Report Lost Item</Text>
            <Text style={styles.cardSubtitle}>Tell us what you&apos;re looking for.</Text>
          </View>
          <ChevronRight size={20} color={Colors.mutedForeground} />
        </Pressable>

        <Pressable
          style={[styles.card, Shadows.card]}
          onPress={() => router.push('/(student)/report-found')}
        >
          <View style={[styles.cardIcon, { backgroundColor: Colors.successSoft }]}>
            <PackageCheck size={28} color={Colors.success} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Report Found Item</Text>
            <Text style={styles.cardSubtitle}>Post an item you found.</Text>
          </View>
          <ChevronRight size={20} color={Colors.mutedForeground} />
        </Pressable>
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 16, paddingHorizontal: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    minHeight: 144,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 20,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
});
