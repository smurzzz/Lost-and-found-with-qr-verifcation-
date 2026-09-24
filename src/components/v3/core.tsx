/**
 * ClaimIt v3 shared primitives — ported 1:1 from the Lovable source
 * (claimit-app.tsx + shadcn tokens). Login does NOT use these.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ArrowLeft, PackageCheck } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';

/* ------------------------------------------------------------------ */
/* BrandMark                                                           */
/* ------------------------------------------------------------------ */

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandTile, compact ? styles.brandTileSm : styles.brandTileLg]}>
        <PackageCheck size={compact ? 20 : 24} strokeWidth={2.4} color={Colors.primaryForeground} />
      </View>
      <Text style={[styles.brandName, { fontSize: compact ? 18 : 20 }]}>ClaimIt</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* StatusPill                                                          */
/* ------------------------------------------------------------------ */

export type PillStatus = 'unclaimed' | 'dropoff' | 'pending' | 'released';

const pillStyles: Record<PillStatus, { bg: string; border: string; text: string; dot: string }> = {
  unclaimed: {
    bg: Colors.muted,
    border: Colors.border,
    text: Colors.mutedForeground,
    dot: Colors.mutedForeground,
  },
  dropoff: {
    bg: Colors.card,
    border: '#9aa8b8',
    text: Colors.mutedForeground,
    dot: Colors.mutedForeground,
  },
  pending: {
    bg: Colors.pendingSoft,
    border: 'rgba(235,160,2,0.2)',
    text: Colors.pendingForeground,
    dot: Colors.pending,
  },
  released: {
    bg: Colors.successSoft,
    border: 'rgba(0,188,123,0.15)',
    text: Colors.successForeground,
    dot: Colors.success,
  },
};

const pillCopy: Record<PillStatus, string> = {
  unclaimed: 'Unclaimed',
  dropoff: 'Pending drop-off',
  pending: 'Pending claim',
  released: 'Released',
};

export function StatusPill({ status }: { status: PillStatus }) {
  const s = pillStyles[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={[styles.pillDot, { backgroundColor: s.dot }]} />
      <Text style={[styles.pillText, { color: s.text }]}>{pillCopy[status]}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Header (large title + optional back + optional right action)        */
/* ------------------------------------------------------------------ */

export function Header({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            onPress={onBack}
            style={styles.backButton}
            hitSlop={8}
          >
            <ArrowLeft size={22} color={Colors.foreground} />
          </Pressable>
        ) : null}
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {action}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Button (v3)                                                         */
/* ------------------------------------------------------------------ */

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'success';

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  default: { bg: Colors.primary, text: Colors.primaryForeground },
  secondary: { bg: Colors.secondary, text: Colors.secondaryForeground },
  outline: { bg: 'transparent', text: Colors.foreground, border: Colors.border },
  ghost: { bg: 'transparent', text: Colors.foreground },
  link: { bg: 'transparent', text: Colors.primary },
  success: { bg: Colors.success, text: Colors.successForeground },
};

export function Button3({
  label,
  onPress,
  variant = 'default',
  height = 56,
  radius = Radius.input,
  style,
  children,
  textStyle,
  disabled,
}: {
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  height?: number;
  radius?: number;
  style?: object;
  children?: ReactNode;
  textStyle?: object;
  disabled?: boolean;
}) {
  const v = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: v.bg,
          height,
          borderRadius: radius,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
        },
        variant === 'default' && height >= 52 ? Shadows.brand : null,
        style,
      ]}
    >
      {children}
      {label ? (
        <Text
          style={[
            styles.buttonText,
            { color: v.text },
            variant === 'link' && { color: Colors.primary },
            textStyle,
          ]}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Small pill button used for category chips. */
export function ChipButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? Colors.primary : 'transparent',
          borderWidth: active ? 0 : 1,
          borderColor: Colors.border,
        },
      ]}
    >
      <Text
        style={[styles.chipText, { color: active ? Colors.primaryForeground : Colors.foreground }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Input + FormField                                                   */
/* ------------------------------------------------------------------ */

export function Input3({
  placeholder,
  value,
  onChangeText,
  editable = true,
}: {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={Colors.mutedForeground}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      style={styles.input}
    />
  );
}

export function FormField({
  label,
  placeholder,
  trailing,
  value,
  onChangeText,
  onPress,
  error,
}: {
  label: string;
  placeholder: string;
  trailing?: ReactNode;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  error?: string;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrap}>
        {onPress ? (
          <Pressable onPress={onPress} style={styles.inputPress}>
            <Text
              style={[
                styles.inputText,
                { color: value ? Colors.foreground : Colors.mutedForeground },
              ]}
            >
              {value || placeholder}
            </Text>
          </Pressable>
        ) : (
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={Colors.mutedForeground}
            value={value}
            onChangeText={onChangeText}
            style={[styles.inputText, error ? styles.inputError : null]}
          />
        )}
        {trailing ? <View style={styles.fieldTrailing}>{trailing}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function TextArea3({
  placeholder,
  value,
  onChangeText,
  minHeight = 112,
  style,
  error,
}: {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  minHeight?: number;
  style?: object;
  error?: string;
}) {
  return (
    <View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={Colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
        style={[styles.textarea, { minHeight }, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  brandTileSm: { width: 36, height: 36 },
  brandTileLg: { width: 44, height: 44 },
  brandName: {
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  chip: {
    height: 36,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  input: {
    height: 56,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.foreground,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  fieldInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputPress: { flex: 1, paddingVertical: 17 },
  inputText: {
    height: 56,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingLeft: 16,
    paddingRight: 44,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.foreground,
  },
  fieldTrailing: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  textarea: {
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: 16,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.foreground,
  },
  inputError: {
    borderColor: Colors.destructive,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.destructive,
  },
});
