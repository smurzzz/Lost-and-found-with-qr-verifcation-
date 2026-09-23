import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Shadows, Spacing } from '@/constants/theme';
import { mockScanResult } from '@/mocks/staff';

/**
 * Staff: Scan to Release (09-FUNCTIONALITY-PROMPT.md §11) — Phase 1 static
 * build. The dark camera screen with orange viewfinder corners. Real camera
 * + barcode scanning (expo-camera) lands in Phase 6; here the scan resolves
 * after a moment to the mock claim sheet. Confirm Release routes to the
 * Audit Log (mockup #screen-12); Cancel dismisses the sheet and rescans.
 */

/** Scan-to-release flow states: idle → scanning → verified sheet. */
type ScanState = 'idle' | 'scanning' | 'verified';

export default function StaffScanScreen() {
  const [state, setState] = useState<ScanState>('scanning');

  /** Oscillating scan line (mockup @keyframes scan: ±70px, 2.2s loop). */
  const [lineY] = useState(() => new Animated.Value(-70));
  useEffect(() => {
    if (state !== 'scanning') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, {
          toValue: 70,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(lineY, {
          toValue: -70,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, lineY]);

  // Phase 1 camera simulation: a scan "detects" 1.8s after (re)starting.
  useEffect(() => {
    if (state !== 'scanning') return;
    const timer = setTimeout(() => setState('verified'), 1800);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Scan topbar (mockup .scan-top): back, title, help */}
        <View style={styles.topbar}>
          <ThemedText
            accessibilityRole="button"
            style={styles.backGlyph}
            onPress={() => router.back()}
          >
            ‹
          </ThemedText>
          <ThemedText style={styles.topbarTitle}>Scan QR Tag</ThemedText>
          <ThemedText style={styles.helpGlyph}>?</ThemedText>
        </View>

        {/* Viewfinder (mockup .scanner): corners + animated scan line */}
        <View style={styles.scanner} accessibilityLabel="Camera viewfinder">
          <View style={styles.corners}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          {state === 'scanning' ? (
            <View style={styles.scanLineWrap} pointerEvents="none">
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: lineY }] }]} />
            </View>
          ) : (
            <View style={styles.scanLineWrap} pointerEvents="none">
              <View style={styles.scanFrameFlash}>
                <ThemedText style={styles.scanFrameFlashText}>✓</ThemedText>
              </View>
            </View>
          )}
          <ThemedText style={styles.scanHelp}>
            ⌾&nbsp; {state === 'scanning' ? 'Point at the item’s QR tag' : 'Tag recognized'}
          </ThemedText>
        </View>

        {/* Bottom sheet: scanning hint or verified claim (mockup .scan-sheet) */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {state === 'verified' ? (
            <>
              <ThemedText style={styles.successLine}>✓&nbsp; QR tag verified</ThemedText>
              <ThemedText style={styles.sheetTitle}>{mockScanResult.title}</ThemedText>
              <View style={styles.detailGrid}>
                <ThemedText style={styles.detailLabel}>Claimant</ThemedText>
                <ThemedText style={styles.detailValue}>{mockScanResult.claimant}</ThemedText>
                <ThemedText style={styles.detailLabel}>Verification</ThemedText>
                <ThemedText style={styles.detailValue}>{mockScanResult.verification}</ThemedText>
                <ThemedText style={styles.detailLabel}>Status</ThemedText>
                <StatusBadge label={mockScanResult.status} tone="amber" />
              </View>
              <Button
                label="Confirm Release"
                variant="green"
                onPress={() => router.replace('/(staff)/audit')}
                style={styles.sheetButton}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => setState('scanning')}
                style={styles.textAction}
              >
                <ThemedText style={styles.textActionText}>Cancel</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <ThemedText style={styles.sheetTitle}>Waiting for a tag…</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.sheetCopy}>
                Hold the camera steady over the QR tag printed on the item. The claim sheet opens
                automatically once it&apos;s recognized.
              </ThemedText>
              <Button
                label="Cancel Scan"
                variant="light"
                onPress={() => router.back()}
                style={styles.sheetButton}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Dark screen (mockup .scan-phone)
  screen: {
    flex: 1,
    backgroundColor: '#161b36',
  },
  safeArea: {
    flex: 1,
  },
  topbar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  backGlyph: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 34,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  topbarTitle: {
    color: '#ffffff',
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
  },
  helpGlyph: {
    color: '#ffffff',
    fontSize: 18,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  // Viewfinder (mockup .scanner)
  scanner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  corners: {
    height: 205,
    position: 'relative',
    width: 205,
  },
  corner: {
    borderColor: Colors.light.orange,
    borderStyle: 'solid',
    height: 32,
    position: 'absolute',
    width: 32,
  },
  cornerTL: {
    borderLeftWidth: 3,
    borderTopLeftRadius: 9,
    borderTopWidth: 3,
    left: 0,
    top: 0,
  },
  cornerTR: {
    borderRightWidth: 3,
    borderTopRightRadius: 9,
    borderTopWidth: 3,
    right: 0,
    top: 0,
  },
  cornerBL: {
    borderBottomLeftRadius: 9,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 0,
    left: 0,
  },
  cornerBR: {
    borderBottomRightRadius: 9,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 0,
    right: 0,
  },
  scanLineWrap: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scanLine: {
    backgroundColor: Colors.light.orange,
    borderRadius: 1,
    height: 2,
    shadowColor: Colors.light.orange,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    width: 195,
  },
  scanFrameFlash: {
    alignItems: 'center',
    backgroundColor: Colors.light.green,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  scanFrameFlashText: {
    color: '#ffffff',
    fontFamily: Fonts.dm.bold,
    fontSize: 20,
  },
  scanHelp: {
    bottom: 34,
    color: '#e4e5f7',
    fontSize: 12,
    position: 'absolute',
  },

  // Bottom sheet (mockup .scan-sheet)
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing.two + 9,
    paddingTop: Spacing.two + 3,
    position: 'absolute',
    right: 0,
    ...Shadows.card,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#d9d9e8',
    borderRadius: 9,
    height: 4,
    marginBottom: Spacing.two + 4,
    width: 36,
  },
  successLine: {
    color: Colors.light.green,
    fontFamily: Fonts.dm.bold,
    fontSize: 13,
  },
  sheetTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 16,
    letterSpacing: 0,
    marginVertical: Spacing.two,
  },
  sheetCopy: {
    marginBottom: Spacing.two,
  },
  detailGrid: {
    gap: Spacing.xs + 1,
  },
  detailLabel: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  detailValue: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.semibold,
    fontSize: 12,
  },
  sheetButton: {
    marginTop: Spacing.two + 3,
  },
  textAction: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  textActionText: {
    color: Colors.light.textSecondary,
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
  },
});
