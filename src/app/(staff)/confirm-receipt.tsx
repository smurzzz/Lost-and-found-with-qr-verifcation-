import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Shadows, Spacing } from '@/constants/theme';
import { generateTagId } from '@/lib/qr-tag';
import { mockFoundItems } from '@/mocks/items';
import { mockStudentReports } from '@/mocks/staff';

type ReceiptTarget = {
  id: string;
  title: string;
  /** "{category} · Found at {location}" line */
  detailLine: string;
  /** "Reported by …" / "Logged by …" line */
  reporterLine: string;
  /** "Today · 9:20 AM" line */
  timeLine: string;
};

/**
 * Staff: Confirm Receipt (09-FUNCTIONALITY-PROMPT.md §9) — Phase 1 static
 * build. Resolves the tapped report (`reportId`) or pending item (`itemId`)
 * from the dashboard, shows the custody receipt card, and on confirm
 * generates the QR tag and routes to the QR Tag screen (mockup #screen-10).
 */
export default function StaffConfirmReceiptScreen() {
  const params = useLocalSearchParams<{ reportId?: string; itemId?: string }>();

  const fromReport = mockStudentReports.find((r) => r.id === params.reportId);
  const fromItem = mockFoundItems.find(
    (i) => i.id === params.itemId && i.status === 'pending_dropoff',
  );

  const target: ReceiptTarget | null = fromReport
    ? {
        id: fromReport.id,
        title: fromReport.title,
        detailLine: `${fromReport.category} · Found at ${fromReport.location}`,
        reporterLine: `Reported by ${fromReport.reporter}`,
        timeLine: fromReport.reportedAt.replace(', ', ' · '),
      }
    : fromItem
      ? {
          id: fromItem.id,
          title: fromItem.title,
          detailLine: `${fromItem.category} · Found at ${fromItem.location}`,
          reporterLine:
            fromItem.source === 'student_reported' ? 'Reported by Alex Morgan' : 'Logged by staff',
          timeLine: `${fromItem.foundDate} · ${fromItem.foundTime}`,
        }
      : null;

  const handleConfirm = () => {
    if (!target) return;
    // Phase 1: no write (08-PHASE-PLAN.md §1.2). Generate the tag the
    // subcopy promises and hand it to the QR Tag screen with item context.
    const tagId = generateTagId();
    const search = new URLSearchParams({
      tagId,
      title: target.title,
      detail: target.detailLine,
    });
    router.replace(`/(staff)/qr-tag?${search.toString()}`);
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
          <ThemedText style={styles.topbarTitle}>Confirm Receipt</ThemedText>
          <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.kicker}>09 / STAFF FLOW</ThemedText>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Take custody{'\n'}
            <ThemedText style={styles.pageTitleAccent}>with confidence.</ThemedText>
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subcopy}>
            Confirm staff received this item to create its QR tag.
          </ThemedText>

          {target ? (
            <>
              {/* Receipt card (mockup .receipt-card) with real data */}
              <View style={styles.receiptCard}>
                <View style={styles.receiptIconWrap}>
                  <ThemedText style={styles.receiptIcon}>▣</ThemedText>
                </View>
                <StatusBadge label="Pending drop-off" tone="amber" />
                <ThemedText style={styles.receiptTitle}>{target.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {target.detailLine}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {target.reporterLine}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {target.timeLine}
                </ThemedText>
              </View>

              {/* Green check note (mockup .check-note) */}
              <View style={styles.checkNote}>
                <ThemedText style={styles.checkNoteText}>
                  ✓&nbsp; Once confirmed, the item becomes visible as Available and can receive
                  claims.
                </ThemedText>
              </View>

              <Button
                label="Confirm Receipt & Generate QR"
                icon="⌾"
                variant="green"
                onPress={handleConfirm}
                style={styles.confirm}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Not Received Yet"
                onPress={() => router.back()}
                style={styles.textAction}
              >
                <ThemedText style={styles.textActionText}>Not Received Yet</ThemedText>
              </Pressable>
            </>
          ) : (
            <View style={styles.noTarget}>
              <ThemedText type="small" themeColor="textSecondary">
                No pending item selected — open one from the Staff Dashboard&apos;s Confirm Receipt
                button.
              </ThemedText>
              <Button
                label="Back to Dashboard"
                variant="light"
                onPress={() => router.replace('/(staff)/dashboard')}
                style={styles.noTargetButton}
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
  kicker: {
    color: Colors.light.accent,
    fontFamily: Fonts.jakarta.bold,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 29,
    marginTop: Spacing.xs,
  },
  pageTitleAccent: {
    color: Colors.light.accent,
  },
  subcopy: {
    marginBottom: Spacing.two + 2,
    marginTop: Spacing.xs + 2,
  },

  // Receipt card (mockup .receipt-card)
  receiptCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 15,
    borderWidth: 1,
    gap: Spacing.xs + 1,
    marginVertical: Spacing.two + 4,
    padding: Spacing.four,
    ...Shadows.card,
  },
  receiptIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: 15,
    height: 48,
    justifyContent: 'center',
    marginBottom: Spacing.half,
    width: 48,
  },
  receiptIcon: {
    color: '#6265a4',
    fontSize: 25,
  },
  receiptTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 16,
    letterSpacing: 0,
    marginTop: Spacing.half,
  },

  // Check note (mockup .check-note)
  checkNote: {
    backgroundColor: Colors.light.greenSoft,
    borderRadius: 9,
    marginBottom: Spacing.two,
    padding: Spacing.two + 2,
  },
  checkNoteText: {
    color: '#5d6d68',
    fontSize: 12,
    lineHeight: 17,
  },

  confirm: {
    marginTop: Spacing.two,
  },
  textAction: {
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    width: '100%',
  },
  textActionText: {
    color: Colors.light.textSecondary,
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
  },

  // No-target fallback
  noTarget: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 15,
    borderWidth: 1,
    gap: Spacing.two,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  noTargetButton: {
    width: '100%',
  },
});
