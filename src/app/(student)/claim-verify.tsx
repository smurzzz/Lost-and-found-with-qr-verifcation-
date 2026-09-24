/**
 * Verify Your Claim — v3 port (ClaimScreen). Item summary card +
 * distinctive-detail textarea → claim success.
 *
 * Phase 6: the student feed passes a real item id; this screen resolves the
 * live ItemRow via useItem (mocks are the demo fallback).
 * Phase 7: "Submit Claim" writes a real claim — insertClaim (claim 'pending',
 * 'claim_requested' audit) and migration 05's trigger moves the item
 * available → pending_claim server-side. Demo mode keeps the mock navigate.
 */

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Image } from 'expo-image';
import { PackageCheck } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, Header, StatusPill, TextArea3 } from '@/components/v3/core';
import { itemStatusToPill } from '@/components/v3/feed';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { useItem } from '@/lib/hooks/use-items';
import { useClaimItem } from '@/lib/hooks/use-claims';
import { useSession } from '@/lib/session';
import { items } from '@/mocks/data';

export default function ClaimVerifyScreen() {
  const [detail, setDetail] = useState('');
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const { isDemo, dbUser } = useSession();
  const itemQuery = useItem(isDemo ? null : (itemId ?? null));
  const item = itemQuery.data;
  const claim = useClaimItem();

  const demoItem = items.find((candidate) => candidate.id === itemId) ?? items[1]; // White headphones.
  const name = isDemo ? demoItem.name : item?.title;
  const meta = isDemo
    ? `${demoItem.category} · ${demoItem.location}`
    : item
      ? `${item.category} · ${item.found_location}`
      : undefined;
  const image = isDemo ? demoItem.image : undefined;
  const pillStatus = isDemo ? 'pending' : item ? itemStatusToPill[item.status] : undefined;
  const detailTrimmed = detail.trim();
  const detailTooShort = !isDemo && detailTrimmed.length > 0 && detailTrimmed.length < 5;
  const canSubmit = isDemo || Boolean(item && dbUser && detailTrimmed.length >= 5);

  function handleSubmit() {
    if (isDemo) {
      router.push('/(student)/claim-success');
      return;
    }
    if (!item || !dbUser) return;
    claim.mutate(
      {
        item_id: item.id,
        claimant_id: dbUser.id,
        verification_answer: detail.trim(),
      },
      {
        onSuccess: () => router.push('/(student)/claim-success'),
      },
    );
  }

  return (
    <V3Screen
      nav={
        <BottomNav3
          role="student"
          active="home"
          onSelect={(tab) => router.push(tabRoute('student', tab))}
        />
      }
    >
      <Header title="Verify Your Claim" onBack={() => router.push('/(student)/home')} />
      <View style={styles.body}>
        <View style={[styles.itemCard, Shadows.card]}>
          {itemQuery.isLoading && !isDemo ? (
            <View style={styles.itemImage}>
              <View style={styles.itemImagePlaceholder}>
                <Text style={styles.itemImagePlaceholderText}>Loading item…</Text>
              </View>
            </View>
          ) : isDemo || item ? (
            <>
              {image ? (
                <Image source={image} style={styles.itemImage} contentFit="cover" transition={0} />
              ) : (
                <View style={styles.itemImage}>
                  <View style={styles.itemImagePlaceholder}>
                    <PackageCheck size={48} color={Colors.card} />
                  </View>
                </View>
              )}
              <View style={styles.itemBody}>
                <View style={styles.itemTop}>
                  <View style={styles.itemText}>
                    <Text style={styles.itemName}>{name}</Text>
                    <Text style={styles.itemMeta}>{meta}</Text>
                  </View>
                  {pillStatus ? <StatusPill status={pillStatus} /> : null}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.itemImage}>
              <View style={styles.itemImagePlaceholder}>
                <Text style={styles.itemImagePlaceholderText}>
                  {itemQuery.isError ? 'Could not load this item.' : 'Item not found.'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.question}>What&apos;s distinctive about this item?</Text>
          <Text style={styles.hint}>
            Tell staff something that isn&apos;t obvious from the listing.
          </Text>
          <TextArea3
            placeholder="For example: a small scratch under the left ear cup..."
            value={detail}
            onChangeText={setDetail}
            minHeight={128}
            style={styles.textarea}
          />
          {detailTooShort ? (
            <Text style={styles.charHint}>Please make it at least 5 characters.</Text>
          ) : null}
        </View>

        {claim.isError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {claim.error instanceof Error
                ? claim.error.message
                : 'Could not submit your claim. Please try again.'}
            </Text>
          </View>
        ) : null}

        <Button3
          label={claim.isPending ? 'Submitting…' : 'Submit Claim'}
          disabled={!canSubmit || claim.isPending}
          onPress={handleSubmit}
        />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16 },
  itemCard: {
    overflow: 'hidden',
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 2 / 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.muted,
  },
  itemImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.card,
  },
  itemBody: { padding: 16 },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemText: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  question: {
    marginTop: 24,
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  hint: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  textarea: { marginTop: 12 },
  charHint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  errorBanner: {
    marginTop: 16,
    borderRadius: Radius.input,
    backgroundColor: Colors.muted,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.destructive,
  },
});
