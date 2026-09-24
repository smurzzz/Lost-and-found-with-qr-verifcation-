/**
 * ReportForm — v3 port (ReportForm in claimit-app.tsx). Shared by
 * report-lost and report-found; differs by type copy and submit target.
 * §1.2: the form validates on submit and shows inline per-field errors;
 * a valid submit navigates (no write in Phase 1).
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronDown, CircleHelp, Clock3, ImagePlus, MapPin } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '@/constants/design';
import { Button3, FormField, Header, TextArea3 } from '@/components/v3/core';
import { V3Screen } from '@/components/v3/screen';

type Errors = {
  category?: string;
  description?: string;
  date?: string;
  location?: string;
};

export function ReportForm({
  type,
  onBack,
  onSubmit,
  nav,
}: {
  type: 'Lost' | 'Found';
  onBack: () => void;
  onSubmit: () => void;
  nav?: React.ReactNode;
}) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  function validate(): boolean {
    const next: Errors = {};
    if (!category.trim()) next.category = 'Please select a category.';
    if (!description.trim()) next.description = 'Please describe the item.';
    if (!date.trim()) next.date = 'Please choose a date.';
    if (!location.trim()) next.location = 'Please enter a location.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (validate()) onSubmit();
  }

  function clearError(field: keyof Errors) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  return (
    <V3Screen nav={nav}>
      <Header title={`Report a ${type} Item`} onBack={onBack} />
      <View style={styles.form}>
        <FormField
          label="Category"
          placeholder="Select a category"
          value={category}
          onChangeText={(text) => {
            setCategory(text);
            clearError('category');
          }}
          error={errors.category}
          trailing={<ChevronDown size={20} color={Colors.mutedForeground} />}
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
        <FormField
          label={`Date ${type.toLowerCase()}`}
          placeholder="Sep 24, 2026"
          value={date}
          onChangeText={(text) => {
            setDate(text);
            clearError('date');
          }}
          error={errors.date}
          trailing={<Clock3 size={20} color={Colors.mutedForeground} />}
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
          trailing={<MapPin size={20} color={Colors.mutedForeground} />}
        />
        <Pressable style={styles.photoButton}>
          <View style={styles.photoIcon}>
            <ImagePlus size={20} color={Colors.mutedForeground} />
          </View>
          <View>
            <Text style={styles.photoTitle}>Add reference photo</Text>
            <Text style={styles.photoSubtitle}>Optional · JPG or PNG</Text>
          </View>
        </Pressable>
        <View style={styles.hint}>
          <CircleHelp size={20} color={Colors.primary} />
          <Text style={styles.hintText}>
            {type === 'Lost'
              ? 'Providing accurate details helps staff identify possible matches.'
              : 'Your report will appear right away. Please bring the item to staff so it can be confirmed and tagged.'}
          </Text>
        </View>
        <Button3 label="Submit Report" onPress={handleSubmit} />
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
  photoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  photoSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.mutedForeground,
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
});
