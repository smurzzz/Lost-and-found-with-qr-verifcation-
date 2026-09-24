/**
 * QR Tag (staff) — v3 port (QrTag): brand mark, big QR tile, item line,
 * mono-ish id pill, "Staff verified" footer, Print/Done buttons.
 *
 * Phase 4: when a real item id is passed (after Log Found Item), the screen
 * renders that item with its server-minted qr_code as a genuinely scannable
 * QR. Without a param (e.g. the Phase 1 demo/confirm-receipt click-through) it
 * falls back to a generated placeholder tag.
 */

import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ShieldCheck } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { BrandMark, Button3, Header } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { formatFoundDate } from '@/lib/dates';
import { useItem } from '@/lib/hooks/use-items';
import { generateTagId } from '@/lib/qr-tag';
import { useSession } from '@/lib/session';

const todayStamp = new Date().toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function QrTagScreen() {
  const { isDemo } = useSession();
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const { data: item, isLoading } = useItem(isDemo ? null : itemId);

  const real = !isDemo && Boolean(itemId);
  const tagId = real ? (item?.qr_code ?? '') : generateTagId();
  const name = real ? (item?.title ?? '') : 'Green water bottle';
  const meta = real
    ? item
      ? `${item.category} · ${item.found_location} · ${formatFoundDate(item.found_date, false)}`
      : ''
    : `Other · West Gym · ${todayStamp}`;

  return (
    <V3Screen
      nav={
        <BottomNav3
          role="staff"
          active="scan"
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
          {isLoading || !tagId ? (
            <View style={[styles.qrFrame, styles.qrFrameLoading]}>
              <Text style={styles.loadingText}>Loading tag…</Text>
            </View>
          ) : (
            <View style={styles.qrFrame}>
              <QRCode value={tagId} size={168} />
            </View>
          )}
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemMeta}>{meta}</Text>
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
    backgroundColor: '#ffffff',
    borderWidth: 8,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrFrameLoading: {
    backgroundColor: Colors.muted,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.mutedForeground,
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
