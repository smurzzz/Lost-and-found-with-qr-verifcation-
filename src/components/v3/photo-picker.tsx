/**
 * PhotoPicker — functional photo attachment for report forms.
 * Tapping opens a native action sheet (Take photo / Choose from gallery).
 * After picking, shows a preview with a remove button. The caller receives
 * the local file URI and uploads it on submit (src/lib/storage.ts).
 */

import { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '@/constants/design';

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

export function PhotoPicker({
  photo,
  onChange,
}: {
  photo: PickedPhoto | null;
  onChange: (photo: PickedPhoto | null) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pick(source: 'camera' | 'library') {
    setSheetOpen(false);
    setBusy(true);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          source === 'camera'
            ? 'ClaimIt needs camera access to photograph the item.'
            : 'ClaimIt needs photo library access to attach a picture.',
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.7,
              allowsEditing: true,
              aspect: [4, 3],
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.7,
              allowsEditing: true,
              aspect: [4, 3],
            });

      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      onChange({ uri: asset.uri, width: asset.width, height: asset.height });
    } catch {
      Alert.alert('Camera error', 'Could not open the camera. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (photo) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <Pressable
          style={styles.removeButton}
          onPress={() => onChange(null)}
          accessibilityLabel="Remove photo"
        >
          <X size={16} color="#ffffff" />
        </Pressable>
        <Text style={styles.previewNote}>Photo attached — uploads when you submit</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        style={[styles.addButton, busy ? styles.busy : null]}
        onPress={() => setSheetOpen(true)}
        accessibilityLabel="Add item photo"
      >
        <View style={styles.iconWrap}>
          <ImagePlus size={20} color={Colors.mutedForeground} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Add item photo</Text>
          <Text style={styles.subtitle}>Take a photo or choose from gallery</Text>
        </View>
      </Pressable>

      <Modal
        transparent
        visible={sheetOpen}
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add item photo</Text>
            <Pressable style={styles.sheetOption} onPress={() => pick('camera')}>
              <ImagePlus size={20} color={Colors.primary} />
              <Text style={styles.sheetOptionText}>Take a photo</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetOption, styles.sheetOptionLast]}
              onPress={() => pick('library')}
            >
              <ImagePlus size={20} color={Colors.primary} />
              <Text style={styles.sheetOptionText}>Choose from gallery</Text>
            </Pressable>
            <Pressable style={styles.sheetCancel} onPress={() => setSheetOpen(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
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
  busy: { opacity: 0.6 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.foreground },
  subtitle: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },

  previewWrap: { gap: 8 },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.input,
    backgroundColor: Colors.muted,
  },
  removeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNote: { fontSize: 12, color: Colors.mutedForeground },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: Colors.card,
    padding: 16,
    gap: 8,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    padding: 14,
  },
  sheetOptionLast: { marginBottom: 4 },
  sheetOptionText: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.foreground },
  sheetCancel: { alignItems: 'center', paddingVertical: 10 },
  sheetCancelText: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.mutedForeground },
});
