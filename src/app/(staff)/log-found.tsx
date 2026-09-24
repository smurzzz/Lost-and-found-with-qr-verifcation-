/**
 * Log Found Item (staff) — v3 port (StaffForm, non-receipt variant).
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ImagePlus } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '@/constants/design';
import { Button3, FormField, Header, TextArea3 } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';

export default function StaffLogFoundScreen() {
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
      <Header title="Log Found Item" onBack={() => router.push('/(staff)/dashboard')} />
      <View style={styles.form}>
        <FormField label="Category" placeholder="Select a category" />
        <View>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextArea3 placeholder="Describe the item..." minHeight={96} />
        </View>
        <FormField label="Found location" placeholder="Building or room" />
        <FormField label="Found date" placeholder="Today, Sep 24" />
        <View style={styles.photoButton}>
          <ImagePlus size={24} color={Colors.mutedForeground} />
          <Text style={styles.photoText}>Add item photo</Text>
        </View>
        <Button3 label="Log Found Item" onPress={() => router.push('/(staff)/qr-tag')} />
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
  photoText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
});
