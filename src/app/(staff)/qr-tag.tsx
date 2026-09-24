/**
 * QR Tag (staff) — v3 port (QrTag): brand mark, big QR tile, item line,
 * mono-ish id pill, status, "Staff verified" footer, Share/Done buttons.
 *
 * Phase 4: when a real item id is passed (after Log Found Item), the screen
 * renders that item with its server-minted (signed) qr_code as a genuinely
 * scannable QR. Without a param (e.g. the Phase 1 demo/confirm-receipt
 * click-through) it falls back to a generated placeholder tag.
 *
 * §10 decision (documented): no native print plugin ships; "Print Tag" is
 * exported as a platform SHARE/export sheet (react-native Share) carrying the
 * tag id + item record, so staff can air-drop, email, or print the tag text
 * from the share target. "Done" invalidates the items cache so the dashboard's
 * Found Items tab reflects the new row without a manual refresh.
 */

import { Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { ShieldCheck } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { BrandMark, Button3, Header, StatusPill } from '@/components/v3/core';
import { itemStatusToPill } from '@/components/v3/feed';
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
  const queryClient = useQueryClient();

  const real = !isDemo && Boolean(itemId);
  const tagId = real ? (item?.qr_code ?? '') : generateTagId();
  const name = real ? (item?.title ?? '') : 'Green water bottle';
  const meta = real
    ? item
      ? `${item.category} · ${item.found_location} · ${formatFoundDate(item.found_date, false)}`
      : ''
    : `Other · West Gym · ${todayStamp}`;
  const pillStatus = real && item ? itemStatusToPill[item.status] : undefined;

  async function handleShare() {
    const message = real
      ? [
          'ClaimIt item tag',
          `Item: ${item?.title ?? ''}`,
          `Category: ${item?.category ?? ''}`,
          `Found: ${item?.found_location ?? ''}`,
          `Status: ${item?.status ?? ''}`,
          `Tag ID: ${tagId}`,
        ].join('\n')
      : `ClaimIt tag: ${tagId} (demo)`;
    await Share.share({ message }).catch(() => undefined);
  }

  function handleDone() {
    if (real && itemId) {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
    }
    router.push('/(staff)/dashboard');
  }

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
          {pillStatus ? (
            <View style={styles.statusRow}>
              <StatusPill status={pillStatus} />
            </View>
          ) : null}
          <View style={styles.verifiedRow}>
            <ShieldCheck size={20} color={Colors.success} />
            <Text style={styles.verifiedText}>Staff verified</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.action}>
            <Button3
              label="Share Tag"
              variant="outline"
              height={52}
              onPress={() => void handleShare()}
            />
          </View>
          <View style={styles.action}>
            <Button3 label="Done" height={52} onPress={handleDone} />
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
  statusRow: { marginTop: 12, alignItems: 'center' },
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
