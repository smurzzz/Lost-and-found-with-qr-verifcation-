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
import { formatDateChoice, reportCategories, reportDateOptions } from '@/mocks/forms';

/**
 * Report a Lost Item (09-FUNCTIONALITY-PROMPT.md §3) — Phase 1 static build.
 * Form validates required fields (category, description, date, location);
 * submit keeps data on failure and just navigates (mockup links to screen
 * 05, Possible Matches). Real write to lost_reports lands in Phase 5.
 */
export default function ReportLostScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [dateChoice, setDateChoice] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = {
    category: submitAttempted && !category ? 'Choose a category' : null,
    description:
      submitAttempted && description.trim().length < 5
        ? 'Describe the item (at least 5 characters)'
        : null,
    date: submitAttempted && !dateChoice ? 'Pick the date you lost it' : null,
    location: submitAttempted && location.trim() === '' ? 'Add a location' : null,
  };
  const isValid =
    Boolean(category) &&
    description.trim().length >= 5 &&
    Boolean(dateChoice) &&
    location.trim() !== '';

  const pickPhoto = async () => {
    // 03-CODE-STANDARDS.md §7: permission denial gets a specific recovery path.
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
    // Phase 1: no write (08-PHASE-PLAN.md §1.2) — mockup routes to matches.
    router.push('/(student)/matches');
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
          <ThemedText style={styles.topbarTitle}>Report a Lost Item</ThemedText>
          <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.kicker}>03 / STUDENT FLOW</ThemedText>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Tell us what{'\n'}
            <ThemedText style={styles.pageTitleAccent}>went missing.</ThemedText>
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subcopy}>
            Accurate details make it easier to spot a possible match.
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
            <FormField icon="✎" label="Item description" tall error={errors.description}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Black leather wallet with a small photo inside"
                placeholderTextColor={Colors.light.textSecondary}
                multiline
                style={styles.textInput}
              />
            </FormField>
            <FormField
              icon="◷"
              label="Date lost"
              value={dateChoice ? formatDateChoice(dateChoice) : undefined}
              placeholder="When did you lose it?"
              onPress={() => setDateOpen(true)}
              error={errors.date}
            />
            <FormField icon="⌖" label="Location lost" error={errors.location}>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Add location"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.textInput}
              />
            </FormField>

            {/* Reference photo: real picker, optional (09 §3). */}
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
              <FormField
                icon="▧"
                label="Reference photo"
                placeholder="Add a photo"
                onPress={pickPhoto}
              />
            )}
          </View>

          <Button
            label="Submit Report"
            variant="navy"
            onPress={handleSubmit}
            style={styles.submit}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            ⓘ We’ll notify you when a found item may match your report.
          </ThemedText>
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
          title="Date lost"
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
    marginTop: Spacing.two + 4,
  },
  note: {
    marginTop: Spacing.two + 2,
    textAlign: 'center',
  },
});
