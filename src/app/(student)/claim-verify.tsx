import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Shadows, Spacing } from '@/constants/theme';
import { mockFoundItems, mockMatches } from '@/mocks/items';

const MAX_CHARS = 280;
const MIN_CHARS = 5;

type ClaimTarget = {
  id: string;
  title: string;
  category: string;
  location: string;
  photo: number | null;
};

/**
 * Claim Verification (09-FUNCTIONALITY-PROMPT.md §6) — Phase 1 static build.
 * Receives the tapped match (`matchId`) or feed item (`itemId`) via route
 * params and shows its real data — not a hardcoded card. Requires a
 * verification answer (5–280 chars), then shows the Claim Submitted
 * confirmation state. Real claims write lands in Phase 7.
 */
export default function ClaimVerifyScreen() {
  const params = useLocalSearchParams<{ matchId?: string; itemId?: string }>();

  const fromMatch = mockMatches.find((m) => m.id === params.matchId);
  const fromItem = mockFoundItems.find((i) => i.id === params.itemId);
  const target: ClaimTarget | null = fromMatch
    ? {
        id: fromMatch.id,
        title: fromMatch.title,
        category: fromMatch.category,
        location: fromMatch.location,
        photo: fromMatch.photo,
      }
    : fromItem
      ? {
          id: fromItem.id,
          title: fromItem.title,
          category: fromItem.category,
          location: fromItem.location,
          photo: fromItem.photo,
        }
      : null;

  const [answer, setAnswer] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const tooShort = answer.trim().length < MIN_CHARS;
  const error = submitAttempted && tooShort ? `Tell us at least ${MIN_CHARS} characters` : null;
  const isValid = !tooShort;

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!isValid) return;
    setSubmitted(true);
  };

  // Claim Submitted confirmation (09 §6: staff will verify before release).
  if (submitted && target) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topbar}>
            <ThemedText style={styles.topbarTitle}>Verify Your Claim</ThemedText>
            <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
          </View>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <ThemedText style={styles.confirmIcon}>✓</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.confirmTitle}>
              Claim Submitted
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.confirmCopy}>
              Staff will review your answer and verify your claim. Nothing is released until a staff
              member scans the item&apos;s QR tag.
            </ThemedText>
            <View style={styles.pendingNote}>
              <ThemedText style={styles.pendingTitle}>◷ Claim status: Pending</ThemedText>
              <ThemedText style={styles.pendingSub}>
                We&apos;ll notify you once staff reviews it.
              </ThemedText>
            </View>
            <Button
              label="Back to Home"
              variant="navy"
              onPress={() => router.replace('/(student)/home')}
              style={styles.confirmButton}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topbar}>
          <ThemedText
            accessibilityRole="button"
            style={styles.backGlyph}
            onPress={() => router.back()}
          >
            ‹
          </ThemedText>
          <ThemedText style={styles.topbarTitle}>Verify Your Claim</ThemedText>
          <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={styles.kicker}>06 / STUDENT FLOW</ThemedText>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            One detail can{'\n'}
            <ThemedText style={styles.pageTitleAccent}>make it yours.</ThemedText>
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subcopy}>
            Tell staff something about the item that isn&apos;t obvious from the listing.
          </ThemedText>

          {/* Selected item card (mockup .selected-item) with real data */}
          {target ? (
            <View style={styles.selectedItem}>
              {target.photo ? (
                <Image source={target.photo} style={styles.selectedPhoto} />
              ) : (
                <View style={[styles.selectedPhoto, styles.selectedPhotoPlaceholder]}>
                  <ThemedText style={styles.selectedPlaceholderGlyph}>📦</ThemedText>
                </View>
              )}
              <View style={styles.selectedInfo}>
                <StatusBadge label="Possible Match" tone="amber" />
                <ThemedText style={styles.selectedTitle}>{target.title}</ThemedText>
                <ThemedText style={styles.selectedMeta}>Found near {target.location}</ThemedText>
                <ThemedText style={styles.selectedMeta}>{target.category}</ThemedText>
              </View>
            </View>
          ) : (
            <View style={styles.noTarget}>
              <ThemedText type="small" themeColor="textSecondary">
                No item selected — open a match from the Possible Matches screen to claim it.
              </ThemedText>
            </View>
          )}

          {/* Verification question (mockup .question) */}
          <View style={[styles.question, error ? styles.questionError : null]}>
            <ThemedText style={styles.questionLabel}>
              What&apos;s distinctive about this item?
            </ThemedText>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="A small photo of my dog is tucked behind the card slots."
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              maxLength={MAX_CHARS}
              style={styles.answerInput}
            />
            <ThemedText style={styles.charCount}>
              {answer.length} / {MAX_CHARS}
            </ThemedText>
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            ✓ Staff review is required before the item can be released.
          </ThemedText>

          <Button
            label="Submit Claim"
            variant="navy"
            onPress={handleSubmit}
            disabled={!target}
            style={styles.submit}
          />
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

  // Selected item (mockup .selected-item)
  selectedItem: {
    alignItems: 'flex-start',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 1,
    marginBottom: Spacing.two + 1,
    marginTop: Spacing.xs,
    padding: Spacing.two,
  },
  selectedPhoto: {
    borderRadius: 10,
    height: 76,
    width: 76,
  },
  selectedPhotoPlaceholder: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    justifyContent: 'center',
  },
  selectedPlaceholderGlyph: {
    fontSize: 24,
  },
  selectedInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  selectedTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
    letterSpacing: 0,
  },
  selectedMeta: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  noTarget: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: Spacing.two + 1,
    padding: Spacing.three,
  },

  // Question box (mockup .question)
  question: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 11,
    borderWidth: 1,
    padding: Spacing.two + 4,
  },
  questionError: {
    borderColor: Colors.light.danger,
  },
  questionLabel: {
    fontFamily: Fonts.dm.bold,
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  answerInput: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.regular,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 66,
    padding: 0,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    color: Colors.light.textSecondary,
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 11,
    marginTop: 4,
  },

  note: {
    marginTop: Spacing.two,
  },
  submit: {
    marginTop: Spacing.two + 2,
  },

  // Confirmation state
  confirmCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 15,
    borderWidth: 1,
    gap: Spacing.two,
    marginTop: Spacing.five,
    padding: Spacing.four,
    ...Shadows.card,
  },
  confirmIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.light.greenSoft,
    borderRadius: 15,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  confirmIcon: {
    color: Colors.light.green,
    fontFamily: Fonts.dm.bold,
    fontSize: 22,
  },
  confirmTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  confirmCopy: {
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: Spacing.two,
    width: '100%',
  },

  // Amber pending note (shared look with report-found)
  pendingNote: {
    backgroundColor: Colors.light.orangeSoft,
    borderColor: '#f8d796',
    borderRadius: 11,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two + 2,
    width: '100%',
  },
  pendingTitle: {
    color: '#956619',
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
  },
  pendingSub: {
    color: '#9a7d4b',
    fontSize: 11,
  },
});
