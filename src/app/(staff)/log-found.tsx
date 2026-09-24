/**
 * Log Found Item (staff) — v3 port (StaffForm, non-receipt variant).
 * Phase 4: posts to the log-found Edge Function, which writes the item and
 * mints the QR tag server-side, then lands on the QR Tag screen with the id.
 * In demo mode (no EXPO_PUBLIC_* keys) it keeps the Phase 1 click-through behavior.
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ImagePlus } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '@/constants/design';
import { Button3, ChipButton, FormField, Header, TextArea3 } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { useLogFoundItem } from '@/lib/hooks/use-items';
import { useSession } from '@/lib/session';

const CATEGORY_OPTIONS = ['Electronics', 'Bags', 'Clothing', 'IDs/Cards', 'Other'];

const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

interface FormErrors {
  title?: string;
  description?: string;
  location?: string;
}

export default function StaffLogFoundScreen() {
  const { isDemo } = useSession();
  const logMutation = useLogFoundItem();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0] ?? 'Other');
  const [description, setDescription] = useState('');
  const [foundLocation, setFoundLocation] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const busy = logMutation.isPending;

  function submit() {
    const next: FormErrors = {};
    if (title.trim().length < 3) next.title = 'Give the item a short name (3+ characters).';
    if (description.trim().length < 5) next.description = 'Describe the item so it can be matched.';
    if (foundLocation.trim().length < 2) next.location = 'Where was it found?';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (isDemo) {
      router.push('/(staff)/qr-tag');
      return;
    }

    logMutation.mutate(
      {
        title: title.trim(),
        category,
        description: description.trim(),
        found_location: foundLocation.trim(),
      },
      {
        onSuccess: (item) =>
          router.push({ pathname: '/(staff)/qr-tag', params: { itemId: item.id } }),
      },
    );
  }

  return (
    <V3Screen
      nav={
        <BottomNav3
          role="staff"
          active="scan"
          onSelect={(tab) => router.push(tabRoute('staff', tab))}
        />
      }
    >
      <Header
        title="Log Found Item"
        subtitle="Writes the item + QR tag server-side"
        onBack={() => router.push('/(staff)/dashboard')}
      />
      <View style={styles.form}>
        <FormField
          label="Item name"
          placeholder="e.g. Navy backpack"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />

        <View>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                label={option}
                active={category === option}
                onPress={() => setCategory(option)}
              />
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextArea3
            placeholder="Describe the item..."
            minHeight={96}
            value={description}
            onChangeText={setDescription}
            error={errors.description}
          />
        </View>

        <FormField
          label="Found location"
          placeholder="Building or room"
          value={foundLocation}
          onChangeText={setFoundLocation}
          error={errors.location}
        />

        <View>
          <Text style={styles.fieldLabel}>Found date</Text>
          <View style={styles.dateField}>
            <Text style={styles.dateText}>{todayLabel}</Text>
          </View>
        </View>

        <View style={styles.photoButton}>
          <ImagePlus size={24} color={Colors.mutedForeground} />
          <View style={styles.photoTextWrap}>
            <Text style={styles.photoText}>Add item photo</Text>
            <Text style={styles.photoNote}>Optional — arrives in a later phase</Text>
          </View>
        </View>

        {logMutation.isError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {logMutation.error instanceof Error
                ? logMutation.error.message
                : 'Could not log the item.'}
            </Text>
          </View>
        ) : null}

        <Button3 label={busy ? 'Logging…' : 'Log Found Item'} disabled={busy} onPress={submit} />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, paddingHorizontal: 16, paddingBottom: 24 },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateField: {
    minHeight: 56,
    justifyContent: 'center',
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.secondaryForeground,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 96,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
  },
  photoTextWrap: { flex: 1, minWidth: 0 },
  photoText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  photoNote: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  errorBanner: {
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
