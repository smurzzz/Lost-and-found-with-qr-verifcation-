import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius } from '@/constants/theme';

type CategoryChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

/** Filter chip for category lists (Home feed, staff tabs, audit filters). */
export function CategoryChip({ label, active = false, onPress }: CategoryChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <ThemedText style={[styles.label, active && styles.labelActive]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.sm + 1,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },
  chipPressed: {
    opacity: 0.8,
  },
  label: {
    color: Colors.light.textSecondary,
    fontFamily: Fonts.dm.medium,
    fontSize: 12,
  },
  labelActive: {
    color: '#ffffff',
  },
});
