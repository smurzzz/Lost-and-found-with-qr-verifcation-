/**
 * QR Tag (staff) — v3 port (QrTag): brand mark, big QR tile, item line,
 * mono id pill, "Staff verified" footer, Print/Done buttons.
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PackageCheck, ShieldCheck } from 'lucide-react-native';
import Svg, { Rect } from 'react-native-svg';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { BrandMark, Button3, Header } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { generateTagId } from '@/lib/qr-tag';

/** Decorative deterministic QR pattern (real QR lands in a later phase). */
function QrPattern({ seed, size = 160 }: { seed: string; size?: number }) {
  const cells = 13;
  const cell = size / cells;
  const rects = [] as React.ReactElement[];
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      hash = (hash * 1103515245 + 12345) >>> 0;
      if (((hash >>> 16) & 1) === 1) {
        rects.push(<Rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} />);
      }
    }
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill={Colors.primary}>
      {rects}
    </Svg>
  );
}

export default function QrTagScreen() {
  const [tagId] = useState(() => generateTagId());
  void PackageCheck;

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
        title="QR Tag"
        subtitle="Ready to print and attach"
        onBack={() => router.push('/(staff)/dashboard')}
      />
      <View style={styles.body}>
        <View style={[styles.tagCard, Shadows.float]}>
          <BrandMark compact />
          <View style={styles.qrFrame}>
            <QrPattern seed={tagId} />
          </View>
          <Text style={styles.itemName}>Green water bottle</Text>
          <Text style={styles.itemMeta}>Other · West Gym · Sep 24, 2026</Text>
          <View style={styles.idPill}>
            <Text style={styles.idText}>{tagId}</Text>
          </View>
          <View style={styles.verifiedRow}>
            <ShieldCheck size={20} color={Colors.success} />
            <Text style={styles.verifiedText}>Staff verified</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.action}>
            <Button3 label="Print Tag" variant="outline" height={52} onPress={() => undefined} />
          </View>
          <View style={styles.action}>
            <Button3 label="Done" height={52} onPress={() => router.push('/(staff)/dashboard')} />
          </View>
        </View>
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16 },
  tagCard: {
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    padding: 24,
    alignItems: 'center',
  },
  qrFrame: {
    marginVertical: 28,
    width: 208,
    height: 208,
    borderRadius: 16,
    borderWidth: 8,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemName: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  itemMeta: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  idPill: {
    marginTop: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  idText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  verifiedRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.success,
  },
  actions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  action: { flex: 1 },
});
