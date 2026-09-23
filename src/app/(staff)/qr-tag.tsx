import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';
import { generateTagId } from '@/lib/qr-tag';
import { mockFoundItems } from '@/mocks/items';

type QrTagParams = {
  tagId?: string;
  title?: string;
  /** "{category} · {location}" line from Confirm Receipt. */
  detail?: string;
  /** Log Found Item passes the pieces instead. */
  category?: string;
  location?: string;
  /** Dashboard "View QR Tag" resolves from the mock items. */
  itemId?: string;
};

/**
 * Staff: QR Tag Ready (09-FUNCTIONALITY-PROMPT.md §10) — Phase 1 static
 * build. Terminal screen of both intake chains (Log Found Item and Confirm
 * Receipt generate the tag before landing here) and the dashboard's
 * "View QR Tag" action. Print is mocked until Phase 6 provides real codes.
 */

/** Stylized QR placeholder (mockup .fake-qr): navy grid, hollow middle column. */
function FakeQr({ size = 158 }: { size?: number }) {
  const cells = Array.from({ length: 9 }, (_, i) => i);
  const hollow = [1, 4, 7]; // mockup nth-child(2/5/8): middle column
  return (
    <View style={[styles.fakeQr, { width: size, height: size, padding: (size * 7) / 158 }]}>
      {cells.map((i) => (
        <View key={i} style={[styles.fakeQrCell, hollow.includes(i) && styles.fakeQrCellHollow]} />
      ))}
    </View>
  );
}

export default function StaffQrTagScreen() {
  const params = useLocalSearchParams<QrTagParams>();
  const [printed, setPrinted] = useState(false);

  // Stable tag id for direct visits without one (dashboard itemId path).
  const generatedId = useMemo(() => generateTagId(), []);
  const fromItem = params.itemId ? mockFoundItems.find((i) => i.id === params.itemId) : null;

  const title = params.title ?? fromItem?.title ?? null;
  const detail =
    params.detail ??
    (params.category && params.location
      ? `${params.category} · ${params.location}`
      : fromItem
        ? `${fromItem.category} · ${fromItem.location}`
        : null);
  const tagId = params.tagId ?? generatedId;
  // Log Found Item path arrives from logging (not custody), so the success
  // line matches the action that created the tag.
  const successLine = params.category ? '✓ Item logged' : '✓ Receipt confirmed';

  const handlePrint = () => {
    // Phase 1 mock: real print/share lands with QR generation in Phase 6.
    setPrinted(true);
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Topbar (mockup .topbar): back, title, menu */}
        <View style={styles.topbar}>
          <ThemedText
            accessibilityRole="button"
            style={styles.backGlyph}
            onPress={() => router.back()}
          >
            ‹
          </ThemedText>
          <ThemedText style={styles.topbarTitle}>QR Tag Ready</ThemedText>
          <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {title && detail ? (
            <>
              <ThemedText style={styles.successLine}>{successLine}</ThemedText>

              {/* QR card (mockup .qr-card) */}
              <View style={styles.qrCard}>
                <ThemedText style={styles.qrHeading}>⌾&nbsp; Official verification tag</ThemedText>
                <FakeQr />
                <ThemedText style={styles.qrTitle}>{title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {detail}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  ID: {tagId}
                </ThemedText>
                <StatusBadge label="Available" tone="green" />
              </View>

              <Button label="Print Tag" variant="navy" onPress={handlePrint} />
              {printed ? (
                <ThemedText style={styles.printedNote}>
                  ✓ Tag sent to the front-desk printer (Phase 1 mock).
                </ThemedText>
              ) : null}
              <Button
                label="Done"
                variant="light"
                onPress={() => router.replace('/(staff)/dashboard')}
                style={styles.done}
              />
            </>
          ) : (
            <View style={styles.noTarget}>
              <ThemedText type="small" themeColor="textSecondary">
                No tag to show — log an item or confirm a receipt first, or open one from the Staff
                Dashboard&apos;s View QR Tag action.
              </ThemedText>
              <Button
                label="Back to Dashboard"
                variant="light"
                onPress={() => router.replace('/(staff)/dashboard')}
                style={styles.done}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.lavender,
  },
  safeArea: {
    flex: 1,
  },
  topbar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  backGlyph: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.regular,
    fontSize: 30,
    lineHeight: 34,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  topbarTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
  },
  menuGlyph: {
    color: Colors.light.text,
    fontSize: 18,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  scrollContent: {
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.half,
  },
  successLine: {
    color: Colors.light.green,
    fontFamily: Fonts.dm.bold,
    fontSize: 13,
    marginHorizontal: Spacing.half,
    marginTop: Spacing.two,
  },

  // QR card (mockup .qr-card)
  qrCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 15,
    borderWidth: 1,
    gap: Spacing.xs + 1,
    marginVertical: Spacing.four,
    padding: Spacing.four,
    ...Shadows.card,
  },
  qrHeading: {
    color: '#676891',
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
    marginBottom: Spacing.half,
  },
  qrTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 15,
    letterSpacing: 0,
    marginTop: Spacing.xs,
  },

  // Fake QR (mockup .fake-qr.large)
  fakeQr: {
    backgroundColor: Colors.light.surface,
    borderRadius: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: (158 * 6) / 158,
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  fakeQrCell: {
    backgroundColor: Colors.light.text,
    borderRadius: 2,
    height: '29%',
    width: '29%',
  },
  fakeQrCellHollow: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.text,
    borderWidth: 5,
  },

  printedNote: {
    color: Colors.light.green,
    fontSize: 12,
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  done: {
    marginTop: Spacing.two,
  },

  // No-target fallback
  noTarget: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
});
