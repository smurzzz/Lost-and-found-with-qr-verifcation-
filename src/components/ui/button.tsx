import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';

export type ButtonVariant = 'navy' | 'orange' | 'green' | 'light';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Leading glyph (legacy emoji/glyph buttons, e.g. login). */
  icon?: string;
  /** Leading Feather line icon (2025-09 mockup buttons: check-circle…). */
  iconName?: React.ComponentProps<typeof Icon>['name'];
  /** Full pill radius (2025-09 mockups). Defaults to the classic 12px. */
  pill?: boolean;
  disabled?: boolean;
  /** Per 09-FUNCTIONALITY-PROMPT.md: in-flight mutations disable the trigger. */
  loading?: boolean;
  style?: ViewStyle;
};

const variantStyles: Record<ButtonVariant, { bg: string; fg: string; bordered?: boolean }> = {
  navy: { bg: Colors.light.text, fg: '#ffffff' },
  orange: { bg: Colors.light.orange, fg: '#ffffff' },
  green: { bg: Colors.light.green, fg: '#ffffff' },
  light: { bg: Colors.light.surface, fg: Colors.light.text, bordered: true },
};

/** Primary action button used across all ClaimIt screens. */
export function Button({
  label,
  onPress,
  variant = 'navy',
  icon,
  iconName,
  pill = false,
  disabled,
  loading,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg },
        v.bordered && styles.bordered,
        pill && styles.pill,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {iconName ? <Icon name={iconName} size={18} color={v.fg} /> : null}
      {icon ? <ThemedText style={[styles.icon, { color: v.fg }]}>{icon}</ThemedText> : null}
      <ThemedText style={[styles.label, { color: v.fg }]}>
        {loading ? 'Please wait…' : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: Spacing.xs,
    height: 52,
    justifyContent: 'center',
    width: '100%',
  },
  pill: {
    borderRadius: Radius.pill,
    gap: Spacing.two + 1,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.light.line,
  },
  pressed: {
    opacity: 0.85,
    ...Shadows.card,
  } as ViewStyle,
  disabled: {
    opacity: 0.55,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontFamily: Fonts.dm.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
});
