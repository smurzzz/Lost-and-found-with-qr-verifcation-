/**
 * ReportForm — v3 port (ReportForm in claimit-app.tsx). Shared by
 * report-lost and report-found; differs by type copy and submit target.
 * §1.2: the form validates on submit and shows inline per-field errors;
 * a valid submit calls onSubmit(values) — screens decide what to write.
 * Phase 6: fully functional inputs — photo (camera/gallery, uploaded on
 * submit by the screen), category dropdown, native calendar date picker.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CircleHelp } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '@/constants/design';
import { Button3, FormField, Header, TextArea3 } from '@/components/v3/core';
import { V3Screen } from '@/components/v3/screen';
import { CategorySelect, DatePickerField } from '@/components/v3/pickers';
import { PhotoPicker, type PickedPhoto } from '@/components/v3/photo-picker';

type Errors = {
  title?: string;
  category?: string;
  description?: string;
  date?: string;
  location?: string;
};

export interface ReportFormValues {
  /** Item name — required for Found reports (items.title is NOT NULL). */
  title?: string;
  category: string;
  description: string;
  /** ISO date string (from the calendar picker). */
  date: string;
  location: string;
  /** Local image URI picked via camera/gallery (uploaded on submit). */
  photo: PickedPhoto | null;
}

export function ReportForm({
  type,
  onBack,
  onSubmit,
  nav,
  busy = false,
  submitError,
}: {
  type: 'Lost' | 'Found';
  onBack: () => void;
  onSubmit: (values: ReportFormValues) => void;
  nav?: React.ReactNode;
  busy?: boolean;
  submitError?: string;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const isFound = type === 'Found';

  // §3: keep Submit disabled until every required field is non-empty.
  const canSubmit =
    Boolean(category.trim()) &&
    Boolean(description.trim()) &&
    Boolean(date.trim()) &&
    Boolean(location.trim()) &&
    (!isFound || Boolean(title.trim()));

  function validate(): boolean {
    const next: Errors = {};
    if (isFound && !title.trim()) next.title = 'Give the item a name.';
    if (!category.trim()) next.category = 'Please select a category.';
    if (!description.trim()) next.description = 'Please describe the item.';
    if (!date.trim()) next.date = 'Please choose a date.';
    if (!location.trim()) next.location = 'Please enter a location.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (busy) return;
    if (validate()) {
      onSubmit({
        ...(isFound ? { title: title.trim() } : {}),
        category: category.trim(),
        description: description.trim(),
        date: date.trim(),
        location: location.trim(),
        photo,
      });
    }
  }

  function clearError(field: keyof Errors) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  return (
    <V3Screen nav={nav}>
      <Header title={`Report a ${type} Item`} onBack={onBack} />
      <View style={styles.form}>
        {isFound ? (
          <FormField
            label="Item name"
            placeholder="e.g. Navy backpack"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              clearError('title');
            }}
            error={errors.title}
          />
        ) : null}
        <CategorySelect
          value={category}
          onChange={(next) => {
            setCategory(next);
            clearError('category');
          }}
          error={errors.category}
        />
        <View>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextArea3
            placeholder="Color, brand, size, and any distinctive details..."
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              clearError('description');
            }}
            error={errors.description}
          />
        </View>
        <DatePickerField
          label={`Date ${type.toLowerCase()}`}
          value={date}
          onChange={(iso) => {
            setDate(iso);
            clearError('date');
          }}
          error={errors.date}
          maximumDate={new Date()}
        />
        <FormField
          label={`Location ${type.toLowerCase()}`}
          placeholder="Building or room"
          value={location}
          onChangeText={(text) => {
            setLocation(text);
            clearError('location');
          }}
          error={errors.location}
          trailing={<CircleHelp size={0} color="transparent" />}
        />
        <PhotoPicker photo={photo} onChange={setPhoto} />
        <View style={styles.hint}>
          <CircleHelp size={20} color={Colors.primary} />
          <Text style={styles.hintText}>
            {type === 'Lost'
              ? 'Providing accurate details helps staff identify possible matches.'
              : 'Your report will appear right away. Please bring the item to staff so it can be confirmed and tagged.'}
          </Text>
        </View>
        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}
        <Button3
          label={busy ? 'Submitting…' : 'Submit Report'}
          disabled={busy || !canSubmit}
          onPress={handleSubmit}
        />
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
  hint: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: Radius.input,
    backgroundColor: Colors.primarySoft,
    padding: 16,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primary,
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
