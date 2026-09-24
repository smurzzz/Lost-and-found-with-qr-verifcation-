/**
 * Release (staff) — v3 port (Release): dark backdrop with a bottom sheet
 * showing the claimant, the verification answer, and Confirm Release.
 */

import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Check } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, StatusPill } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { items } from '@/mocks/data';

export default function ReleaseScreen() {
  const item = items[1]; // White headphones, per the source.

  return (
    <View style={styles.dark}>
      <V3Screen
        scroll={false}
        nav={
          <BottomNav3
            role="staff"
            active="scan"
            onSelect={(tab) => router.push(tabRoute('staff', tab))}
          />
        }
      >
        <View style={styles.spacer} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.itemRow}>
            <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
            <View style={styles.itemText}>
              <StatusPill status="pending" />
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>Claimant: Taylor Roberts</Text>
            </View>
          </View>
          <View style={[styles.answerCard, Shadows.card]}>
            <Text style={styles.answerLabel}>VERIFICATION ANSWER</Text>
            <Text style={styles.answerText}>Small blue marker line under the left ear cup.</Text>
          </View>
          <Button3
            variant="success"
            style={styles.confirm}
            onPress={() => router.push('/(staff)/released')}
          >
            <Check size={20} color={Colors.successForeground} />
            <Text style={[styles.buttonText, { color: Colors.successForeground }]}>
              Confirm Release
            </Text>
          </Button3>
          <Button3
            label="Cancel"
            variant="ghost"
            height={48}
            style={styles.cancel}
            onPress={() => router.push('/(staff)/scan')}
          />
        </View>
      </V3Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: 'rgba(5,14,26,0.9)' },
  spacer: { flex: 1 },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  handle: {
    alignSelf: 'center',
    marginBottom: 20,
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  itemText: { flex: 1, minWidth: 0 },
  itemName: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  answerCard: {
    marginTop: 20,
    borderRadius: Radius.input,
    backgroundColor: Colors.card,
    padding: 16,
  },
  answerLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.mutedForeground,
  },
  answerText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.foreground,
  },
  confirm: { marginTop: 20 },
  cancel: { marginTop: 8 },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
