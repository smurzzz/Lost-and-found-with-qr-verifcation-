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
import { generateTagId } from '@/lib/qr-tag';

/**
 * Staff: Log Found Item (09-FUNCTIONALITY-PROMPT.md §8) — Phase 1 static
 * build. Validated intake form; submit generates the unique QR tag id the
 * subcopy promises and routes to the QR Tag screen (mockup links screen 10).
 * Real DB write + QR generation land in Phase 5/6.
 */

export default function StaffLogFoundScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateChoice, setDateChoice] = useState<string | null>(null);
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
    location: submitAttempted && location.trim() === '' ? 'Add the found location' : null,
    date: submitAttempted && !dateChoice ? 'Pick the date it was found' : null,
  };
  const isValid =
    Boolean(category) &&
    description.trim().length >= 5 &&
    location.trim() !== '' &&
    Boolean(dateChoice);

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
    // Phase 1: no write (08-PHASE-PLAN.md §1.2). The tag id flows to the
    // QR Tag screen so the record chain is already wired for Phase 5.
    const tagId = generateTagId();
    const params = new URLSearchParams({
      tagId,
      title: description.trim(),
      category: category ?? '',
      location: location.trim(),
      photoUri: photoUri ?? '',
    });
    router.replace(`/(staff)/qr-tag?${params.toString()}`);
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
          <ThemedText style={styles.topbarTitle}>Log Found Item</ThemedText>
          <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.kicker}>08 / STAFF FLOW</ThemedText>
          <ThemedText type="subtitle" style={styles.pageTitle}>
            Create the{'\n'}
            <ThemedText style={styles.pageTitleAccent}>official record.</ThemedText>
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subcopy}>
            Every found item receives a unique QR tag.
          </ThemedText>

          <View style={styles.form}>
            <FormField
              icon="▣"
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
                placeholder="Blue canvas backpack with a red keychain"
                placeholderTextColor={Colors.light.textSecondary}
                multiline
                style={styles.textInput}
              />
            </FormField>
            <FormField icon="⌖" label="Found location" error={errors.location}>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Library, front desk"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.textInput}
              />
            </FormField>
            <FormField
              icon="◷"
              label="Found date"
              value={dateChoice ? `${dateChoice} · ${formatDateChoice(dateChoice)}` : undefined}
              placeholder="When was it found?"
              onPress={() => setDateOpen(true)}
              error={errors.date}
            />

            {/* Item photo: real picker, optional (09 §8). */}
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
                label="Item photo"
                placeholder="Add a photo"
                onPress={pickPhoto}
              />
            )}
          </View>

          <Button
            label="Log Found Item"
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
          title="Found date"
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
});
