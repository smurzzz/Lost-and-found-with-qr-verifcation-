/**
 * Confirm Receipt (staff) — v3 port (StaffForm, receipt variant): the
 * reported item card, a "details match" checkbox, staff note, and the
 * Confirm & Generate QR Tag button.
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, Header } from '@/components/v3/core';
import { ItemCard } from '@/components/v3/feed';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { items } from '@/mocks/data';

export default function ConfirmReceiptScreen() {
  const studentReport = items.find((item) => item.status === 'dropoff');
  const [matches, setMatches] = useState(false);

  return (
    <V3Screen
      nav={
        <BottomNav3
          role="staff"
          active="staff-home"
          onSelect={(tab) => router.push(tabRoute('staff', tab))}
        />
      }
    >
      <Header
        title="Confirm Receipt"
        subtitle="Compare the report with the item in hand."
        onBack={() => router.push('/(staff)/dashboard')}
      />
      <View style={styles.body}>
        {studentReport ? <ItemCard item={studentReport} staff /> : null}

        <Pressable
          style={[styles.matchRow, Shadows.card]}
          onPress={() => setMatches((value) => !value)}
        >
          <View style={[styles.checkbox, matches ? styles.checkboxOn : null]}>
            {matches ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.matchText}>Details match the physical item</Text>
        </Pressable>

        <Button3 label="Confirm & Generate QR Tag" onPress={() => router.push('/(staff)/qr-tag')} />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingHorizontal: 16, paddingBottom: 24 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    borderRadius: Radius.input,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.ring,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkMark: {
    fontSize: 14,
    color: Colors.primaryForeground,
  },
  matchText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
});
