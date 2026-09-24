/**
 * Confirm Receipt (staff) — v3 port (StaffForm, receipt variant): the
 * reported item card, a "details match" checkbox, staff note, and the
 * Confirm & Generate QR Tag button.
 *
 * Phase 8: when a real item id is passed (Student Reports tab), the screen
 * resolves the pending_dropoff item via useItem and confirms it through the
 * `/confirm-receipt` Edge Function — the item becomes available and its QR tag
 * is minted server-side (CP-04) — then routes to the real QR Tag screen. Demo
 * mode keeps the Phase 1 mock click-through.
 */

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, Header } from '@/components/v3/core';
import { ItemCard, StaffItemCard } from '@/components/v3/feed';
import { ItemCardSkeleton } from '@/components/v3/skeleton';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { useConfirmReceipt, useItem } from '@/lib/hooks/use-items';
import { useSession } from '@/lib/session';
import { items } from '@/mocks/data';

export default function ConfirmReceiptScreen() {
  const { isDemo } = useSession();
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const { data: item, isLoading } = useItem(isDemo ? null : itemId);
  const confirm = useConfirmReceipt();
  const [matches, setMatches] = useState(false);

  const demoItem = items.find((item) => item.status === 'dropoff');
  const real = !isDemo && Boolean(itemId);
  const loading = real && isLoading;
  const missing = real && !isLoading && !item;

  const errorMessage = confirm.error instanceof Error ? confirm.error.message : null;

  function handleConfirm() {
    if (!matches || confirm.isPending) return;
    if (isDemo) {
      router.push('/(staff)/qr-tag');
      return;
    }
    confirm.mutate(itemId as string, {
      onSuccess: () => {
        router.push({ pathname: '/(staff)/qr-tag', params: { itemId: itemId as string } });
      },
    });
  }

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
        {isDemo && demoItem ? <ItemCard item={demoItem} staff /> : null}
        {loading ? <ItemCardSkeleton /> : null}
        {real && !loading && item ? (
          <View style={styles.stack}>
            <StaffItemCard item={item} />
            {item.reporter?.name ? (
              <Text style={styles.reporter}>Reported by {item.reporter.name}</Text>
            ) : null}
          </View>
        ) : null}
        {missing ? (
          <View style={styles.feedback}>
            <Text style={styles.feedbackText}>This item is no longer available.</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.matchRow, Shadows.card]}
          onPress={() => setMatches((value) => !value)}
        >
          <View style={[styles.checkbox, matches ? styles.checkboxOn : null]}>
            {matches ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.matchText}>Details match the physical item</Text>
        </Pressable>

        {errorMessage ? (
          <View style={styles.feedback}>
            <Text style={styles.feedbackText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Button3
          label={confirm.isPending ? 'Confirming…' : 'Confirm & Generate QR Tag'}
          disabled={!matches || confirm.isPending}
          onPress={handleConfirm}
        />

        <Button3
          label="Not Received Yet"
          variant="ghost"
          height={48}
          onPress={() => router.back()}
        />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingHorizontal: 16, paddingBottom: 24 },
  stack: { gap: 8 },
  reporter: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.mutedForeground,
    paddingLeft: 4,
  },
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
  feedback: {
    borderRadius: Radius.input,
    backgroundColor: Colors.muted,
    padding: 12,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.destructive,
    textAlign: 'center',
  },
});
