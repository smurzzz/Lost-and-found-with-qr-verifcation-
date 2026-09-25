/**
 * Release (staff) — v3 port (Release) wired to the real scan flow (Phase 9).
 *
 * Dark backdrop with a bottom sheet that pulls the scanned item + its claims
 * from the DB (RLS staff reads — no Edge Function needed for the read) and,
 * as the physical item sits in front of staff, compares the verification
 * answer:
 *
 *   - pending claim → "Approve Claim" (RLS claims_update_staff). This is the
 *     intentionally separate staff approval decision; the release endpoint
 *     refuses anything but an approved claim (CP-06).
 *   - approved claim → "Confirm Release" → POST /release, the ONLY path that
 *     may mark the item claimed (02-ARCHITECTURE.md §4).
 *   - no pending/approved claim → blocked state, no release (CP-06).
 *   - item already claimed → read-only "already released" state.
 *
 * Demo mode (no itemId param) keeps the Phase 1 mock click-through.
 */

import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Check, PackageCheck } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, StatusPill } from '@/components/v3/core';
import { itemStatusToPill } from '@/components/v3/feed';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { useItem, useReleaseItem } from '@/lib/hooks/use-items';
import { useApproveClaim, useClaimsForItem } from '@/lib/hooks/use-claims';
import { useSession } from '@/lib/session';
import { items } from '@/mocks/data';

export default function ReleaseScreen() {
  const { isDemo } = useSession();
  const { itemId, qrCode } = useLocalSearchParams<{ itemId?: string; qrCode?: string }>();
  const realItemId = typeof itemId === 'string' && itemId ? itemId : undefined;
  const scannedQrCode = typeof qrCode === 'string' ? qrCode : undefined;

  const real = !isDemo && Boolean(realItemId);
  const { data: item, isLoading: itemLoading } = useItem(real ? realItemId : null);
  const { data: claims, isLoading: claimsLoading } = useClaimsForItem(real ? realItemId : null);
  const approve = useApproveClaim();
  const release = useReleaseItem();

  const loading = real && (itemLoading || claimsLoading);
  const errorMessage =
    approve.error instanceof Error
      ? approve.error.message
      : release.error instanceof Error
        ? release.error.message
        : null;

  const selectedClaim = useMemo(() => {
    if (!claims) return undefined;
    // Newest approved claim wins; otherwise fall back to the newest pending.
    return (
      claims.find((claim) => claim.status === 'approved') ??
      claims.find((claim) => claim.status === 'pending')
    );
  }, [claims]);

  const demoItem = items[1]; // White headphones, per the source.

  function handleApprove() {
    if (!selectedClaim || approve.isPending) return;
    approve.mutate(selectedClaim.id);
  }

  function handleRelease() {
    if (!item || !selectedClaim || release.isPending) return;
    const scanned = scannedQrCode ?? item.qr_code ?? '';
    if (!scanned) return;
    release.mutate(
      { itemId: item.id, claimId: selectedClaim.id, scannedQrCode: scanned },
      {
        onSuccess: (result) => {
          router.push({
            pathname: '/(staff)/released',
            params: { itemId: item.id, claimId: result.claimId },
          });
        },
      },
    );
  }

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

          {!real ? (
            /* ------------------------------------------------------------ */
            /* Demo (Phase 1) mock click-through                             */
            /* ------------------------------------------------------------ */
            <>
              <View style={styles.itemRow}>
                <Image source={demoItem.image} style={styles.itemImage} resizeMode="cover" />
                <View style={styles.itemText}>
                  <StatusPill status="pending" />
                  <Text style={styles.itemName}>{demoItem.name}</Text>
                  <Text style={styles.itemMeta}>Claimant: Taylor Roberts</Text>
                </View>
              </View>
              <View style={[styles.answerCard, Shadows.card]}>
                <Text style={styles.answerLabel}>VERIFICATION ANSWER</Text>
                <Text style={styles.answerText}>
                  Small blue marker line under the left ear cup.
                </Text>
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
                onPress={() => router.back()}
              />
            </>
          ) : loading ? (
            <Text style={styles.sheetMessage}>Loading release details…</Text>
          ) : !item ? (
            <Text style={styles.sheetMessage}>Item not found.</Text>
          ) : item.status === 'claimed' ? (
            <>
              <Text style={styles.sheetTitle}>Already released</Text>
              <Text style={styles.sheetMessage}>
                {item.title} was already returned to its claimant.
              </Text>
              <Button3
                label="Back to Scan"
                variant="ghost"
                height={48}
                style={styles.cancel}
                onPress={() => router.back()}
              />
            </>
          ) : !selectedClaim ? (
            <>
              <Text style={styles.sheetTitle}>No approved claim</Text>
              <Text style={styles.sheetMessage}>
                {item.title} has no pending or approved claim, so it cannot be released.
              </Text>
              <Button3
                label="Back to Scan"
                variant="ghost"
                height={48}
                style={styles.cancel}
                onPress={() => router.back()}
              />
            </>
          ) : (
            <>
              <View style={styles.itemRow}>
                {item.photo_url ? (
                  <Image
                    source={{ uri: item.photo_url }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.itemTile}>
                    <PackageCheck size={28} color={Colors.primaryForeground} />
                  </View>
                )}
                <View style={styles.itemText}>
                  <StatusPill status={itemStatusToPill[item.status]} />
                  <Text style={styles.itemName}>{item.title}</Text>
                  <Text style={styles.itemMeta}>
                    {item.category} · {item.found_location}
                  </Text>
                </View>
              </View>
              <View style={[styles.answerCard, Shadows.card]}>
                <Text style={styles.answerLabel}>VERIFICATION ANSWER</Text>
                <Text style={styles.answerText}>{selectedClaim.verification_answer}</Text>
              </View>
              <View style={styles.claimantRow}>
                <Text style={styles.claimantName}>
                  Claimant: {selectedClaim.claimant?.name ?? 'Unknown student'}
                </Text>
                <StatusPill
                  status={selectedClaim.status === 'approved' ? 'released' : 'pending'}
                  label={selectedClaim.status === 'approved' ? 'Approved' : 'Pending'}
                />
              </View>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {selectedClaim.status === 'pending' ? (
                <Button3
                  label={approve.isPending ? 'Approving…' : 'Approve Claim'}
                  style={styles.confirm}
                  disabled={approve.isPending}
                  onPress={handleApprove}
                />
              ) : !scannedQrCode && !item.qr_code ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>
                    No scanned tag on record. Re-scan the QR tag to release.
                  </Text>
                </View>
              ) : scannedQrCode && item.qr_code && scannedQrCode !== item.qr_code ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>Scanned tag does not match this item.</Text>
                </View>
              ) : (
                <Button3
                  variant="success"
                  style={styles.confirm}
                  disabled={release.isPending}
                  onPress={handleRelease}
                >
                  <Check size={20} color={Colors.successForeground} />
                  <Text style={[styles.buttonText, { color: Colors.successForeground }]}>
                    {release.isPending ? 'Releasing…' : 'Confirm Release'}
                  </Text>
                </Button3>
              )}
              <Button3
                label="Cancel"
                variant="ghost"
                height={48}
                style={styles.cancel}
                onPress={() => router.back()}
              />
            </>
          )}
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
  itemTile: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  claimantRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  claimantName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  confirm: { marginTop: 20 },
  cancel: { marginTop: 8 },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  sheetMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  errorBanner: {
    marginTop: 16,
    borderRadius: Radius.input,
    backgroundColor: Colors.muted,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.destructive,
    textAlign: 'center',
  },
});
