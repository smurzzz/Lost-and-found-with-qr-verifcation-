/**
 * ReportForm — v3 port (ReportForm in claimit-app.tsx). Shared by
 * report-lost and report-found; differs by type copy and submit target.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronDown, CircleHelp, Clock3, ImagePlus, MapPin } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '@/constants/design';
import { Button3, FormField, Header, TextArea3 } from '@/components/v3/core';
import { V3Screen } from '@/components/v3/screen';

export function ReportForm({
  type,
  onBack,
  onSubmit,
}: {
  type: 'Lost' | 'Found';
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  return (
    <V3Screen>
      <Header title={`Report a ${type} Item`} onBack={onBack} />
      <View style={styles.form}>
        <FormField
          label="Category"
          placeholder="Select a category"
          value={category}
          onChangeText={setCategory}
          trailing={<ChevronDown size={20} color={Colors.mutedForeground} />}
        />
        <View>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextArea3
            placeholder="Color, brand, size, and any distinctive details..."
            value={description}
            onChangeText={setDescription}
          />
        </View>
        <FormField
          label={`Date ${type.toLowerCase()}`}
          placeholder="Sep 24, 2026"
          value={date}
          onChangeText={setDate}
          trailing={<Clock3 size={20} color={Colors.mutedForeground} />}
        />
        <FormField
          label={`Location ${type.toLowerCase()}`}
          placeholder="Building or room"
          value={location}
          onChangeText={setLocation}
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
        <Button3 label="Submit Report" onPress={onSubmit} />
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
