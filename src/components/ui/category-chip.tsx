import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { brand, Fonts, Radius } from '@/constants/theme';

type CategoryChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Optional leading line icon (home-feed chips: Bags, Electronics…). */
  icon?: React.ComponentProps<typeof Icon>['name'];
};

/**
 * Category filter chip (v3 home-feed mockup): rounded-xl pill, navy when
 * active, white with a slate border + navy glyph otherwise.
 */
export function CategoryChip({ label, active = false, onPress, icon }: CategoryChipProps) {
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
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={15} color={active ? '#ffffff' : brand.navy} />
        </View>
      ) : null}
      <ThemedText style={[styles.label, active && styles.labelActive]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  chipActive: {
    backgroundColor: brand.navy,
    borderColor: brand.navy,
  },
  chipPressed: {
    opacity: 0.8,
  },
  iconWrap: {
    marginRight: 6,
  },
  label: {
    color: brand.navy,
    fontFamily: Fonts.dm.medium,
    fontSize: 13,
  },
  labelActive: {
    color: '#ffffff',
    fontFamily: Fonts.dm.semibold,
  },
});
