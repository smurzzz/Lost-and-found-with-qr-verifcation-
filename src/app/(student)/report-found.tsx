import * as ImagePicker from 'expo-image-picker';
import { Image, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormField, SelectModal } from '@/components/ui/form-field';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { reportCategories, reportDateOptions } from '@/mocks/forms';

/**
 * Report a Found Item (09-FUNCTIONALITY-PROMPT.md §4) — Phase 1 static build.
 * Mockup: screen-04 with the amber "Pending drop-off" notice. Per 09 §4 the
 * submit success state is the explicit pending-drop-off confirmation, not a
 * generic toast. Real write (items + audit_log) lands in Phase 5.
 */
export default function ReportFoundScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateChoice, setDateChoice] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    category: submitAttempted && !category ? 'Choose a category' : null,
    description:
      submitAttempted && description.trim().length < 5
        ? 'Describe the item (at least 5 characters)'
        : null,
    location: submitAttempted && location.trim() === '' ? 'Add a location' : null,
    date: submitAttempted && !dateChoice ? 'Pick the date you found it' : null,
  };
  const isValid =
    Boolean(category) &&
    description.trim().length >= 5 &&
    location.trim() !== '' &&
    Boolean(dateChoice);

  const pickPhoto = async () => {
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    let status = permission.status;
    if (!permission.granted) {
      const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') {
      setPhotoUri(null);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!isValid) return;
    // Phase 1: no write — show the pending drop-off confirmation state.
    setSubmitted(true);
  };

  // Confirmation state (09 §4: "Pending drop-off — please bring it to the
  // Front Desk"), shown instead of a generic success toast.
  if (submitted) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topbar}>
            <ThemedText
              accessibilityRole="button"
              style={styles.backGlyph}
              onPress={() => router.replace('/(student)/home')}
            >
              ‹
            </ThemedText>
            <ThemedText style={styles.topbarTitle}>Report a Found Item</ThemedText>
            <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
          </View>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <ThemedText style={styles.confirmIcon}>◷</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.confirmTitle}>
              Pending drop-off
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.confirmCopy}>
              Thanks for reporting! Please bring the item to the Front Desk. A staff member will
              confirm receipt and attach a QR tag.
            </ThemedText>
            <View style={styles.pendingNote}>
              <ThemedText style={styles.pendingTitle}>◷ Pending drop-off</ThemedText>
              <ThemedText style={styles.pendingSub}>
                It becomes available after staff confirms receipt.
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
          <ThemedText style={styles.topbarTitle}>Report a Found Item</ThemedText>
          <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.kicker}>04 / STUDENT FLOW</ThemedText>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Help return it{'\n'}
            <ThemedText style={styles.pageTitleAccent}>to its owner.</ThemedText>
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subcopy}>
            A staff member will confirm receipt and attach a QR tag.
          </ThemedText>

          <View style={styles.form}>
            <FormField
              icon="◉"
              label="Category"
              value={category ?? undefined}
              placeholder="Choose a category"
              onPress={() => setCategoryOpen(true)}
              error={errors.category}
            />
            <FormField icon="✎" label="Description" tall error={errors.description}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Blue water bottle with a sticker"
                placeholderTextColor={Colors.light.textSecondary}
                multiline
                style={styles.textInput}
              />
            </FormField>
            <FormField icon="⌖" label="Location found" error={errors.location}>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Where did you find it?"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.textInput}
              />
            </FormField>
            <FormField
              icon="◷"
              label="Date found"
              value={dateChoice ?? undefined}
              placeholder="When did you find it?"
              onPress={() => setDateOpen(true)}
              error={errors.date}
            />

            {photoUri ? (
              <View style={styles.photoRow}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <ThemedText
                  accessibilityRole="button"
                  style={styles.photoRemove}
                  onPress={() => setPhotoUri(null)}
                >
                  ✕ Remove
                </ThemedText>
              </View>
            ) : (
              <FormField icon="▧" label="Add photo" placeholder="Optional" onPress={pickPhoto} />
            )}
          </View>

          {/* Mockup .pending notice, always visible above the submit button */}
          <View style={styles.pendingNote}>
            <ThemedText style={styles.pendingTitle}>◷ Pending drop-off</ThemedText>
            <ThemedText style={styles.pendingSub}>
              It becomes available after staff confirms receipt.
            </ThemedText>
          </View>

          <Button
            label="Submit Report"
            variant="navy"
            onPress={handleSubmit}
            style={styles.submit}
          />
        </View>

        <SelectModal
          visible={categoryOpen}
          title="Category"
          options={reportCategories}
          selected={category ?? undefined}
          onSelect={setCategory}
          onClose={() => setCategoryOpen(false)}
        />
        <SelectModal
          visible={dateOpen}
          title="Date found"
          options={reportDateOptions}
          selected={dateChoice ?? undefined}
          onSelect={setDateChoice}
          onClose={() => setDateOpen(false)}
        />
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

  content: {
    flex: 1,
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

  form: {
    gap: Spacing.two,
    width: '100%',
  },
  textInput: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.medium,
    fontSize: 14,
    padding: 0,
  },

  // Amber pending notice (mockup .pending)
  pendingNote: {
    backgroundColor: Colors.light.orangeSoft,
    borderColor: '#f8d796',
    borderRadius: 11,
    borderWidth: 1,
    gap: 3,
    marginTop: Spacing.two + 2,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two + 2,
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

  photoRow: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 2,
    minHeight: 62,
    padding: Spacing.two,
  },
  photoPreview: {
    borderRadius: 8,
    height: 46,
    width: 46,
  },
  photoRemove: {
    color: Colors.light.danger,
    fontFamily: Fonts.dm.bold,
    fontSize: 12,
    minHeight: 48,
    textAlignVertical: 'center',
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
    ...({
      shadowColor: '#2b2a66',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    } as const),
  },
  confirmIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: 15,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  confirmIcon: {
    color: Colors.light.accent,
    fontSize: 24,
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
  },
});
