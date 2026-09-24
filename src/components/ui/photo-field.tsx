import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type PhotoFieldProps = {
  label: string;
  placeholder: string;
  /** Local picked-image uri (Phase 1 real picker). */
  photoUri: string | null;
  onPick: () => void;
  onRemove: () => void;
  error?: string | null;
};

/**
 * Photo upload row (report-found/log-found mockups): camera line icon,
 * "Add photo" label with muted helper, chevron — flips to thumbnail +
 * Remove once a real image is picked (expo-image-picker).
 */
export function PhotoField({
  label,
  placeholder,
  photoUri,
  onPick,
  onRemove,
  error,
}: PhotoFieldProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photoUri ? `${label} (added)` : label}
        onPress={photoUri ? onRemove : onPick}
        style={({ pressed }) => [
          styles.field,
          error ? styles.fieldError : null,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.thumb} />
          ) : (
            <Icon name="camera" size={20} color="accent" />
          )}
        </View>
        <View style={styles.textCol}>
          <ThemedText style={styles.labelText}>{label}</ThemedText>
          <ThemedText
            style={[styles.helperText, photoUri && styles.helperActive]}
            numberOfLines={1}
          >
            {photoUri ? 'Photo added — tap to remove' : placeholder}
          </ThemedText>
        </View>
        <View style={styles.chevronWrap}>
          {photoUri ? (
            <Icon name="x" size={18} color={Colors.light.danger} />
          ) : (
            <Icon name="chevron-right" size={18} color="#a9aac4" />
          )}
        </View>
      </Pressable>
      {error ? (
        <ThemedText style={styles.errorText} themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  field: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 4,
    minHeight: 68,
    paddingHorizontal: Spacing.two + 6,
    paddingVertical: Spacing.two + 2,
  },
  fieldError: {
    borderColor: Colors.light.danger,
  },
  pressed: {
    backgroundColor: Colors.light.backgroundSelected,
  },
  iconWrap: {
    alignItems: 'center',
    width: 24,
  },
  thumb: {
    borderRadius: Radius.sm,
    height: 44,
    width: 44,
  },
  textCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  labelText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  helperText: {
    color: '#a9aac4',
    fontFamily: Fonts.dm.regular,
    fontSize: 15,
  },
  helperActive: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.medium,
  },
  chevronWrap: {
    width: 20,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
});
