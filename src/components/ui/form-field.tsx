import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';

type FormFieldProps = {
  /** Leading glyph from the mockup (◉ ✎ ◷ ⌖ ▧). */
  icon: string;
  label: string;
  value?: string;
  /** Empty-state placeholder text (mockup: "Add location"). */
  placeholder?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  /** Multi-line variant (mockup .tall, used for descriptions). */
  tall?: boolean;
  error?: string | null;
  focused?: boolean;
};

/**
 * Mockup-style form row: white rounded field with leading glyph, small
 * label on top and value/placeholder underneath (.form label styles).
 * Either pass `onPress` (select-like fields) or `children` (a TextInput).
 */
export function FormField({
  icon,
  label,
  value,
  placeholder,
  onPress,
  children,
  tall = false,
  error,
  focused = false,
}: FormFieldProps) {
  const showPlaceholder = !value && placeholder;
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        onPress={onPress}
        style={({ pressed }) => [
          styles.field,
          tall && styles.fieldTall,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
          pressed && onPress ? styles.fieldPressed : null,
        ]}
      >
        <ThemedText style={styles.icon}>{icon}</ThemedText>
        <View style={styles.textCol}>
          <ThemedText style={styles.labelText}>{label}</ThemedText>
          {value || showPlaceholder ? (
            <ThemedText
              style={[styles.valueText, showPlaceholder && styles.placeholderText]}
              numberOfLines={tall ? 3 : 1}
            >
              {value ?? placeholder}
            </ThemedText>
          ) : (
            children
          )}
        </View>
        {onPress ? <ThemedText style={styles.chevron}>⌄</ThemedText> : null}
      </Pressable>
      {error ? (
        <ThemedText style={styles.errorText} themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

type SelectModalProps = {
  visible: boolean;
  title: string;
  options: readonly string[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

/** Bottom-sheet option picker used by Category / Date-style fields. */
export function SelectModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: SelectModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <ThemedText style={styles.sheetTitle}>{title}</ThemedText>
          {options.map((option) => {
            const isSelected = option === selected;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <ThemedText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </ThemedText>
                {isSelected ? <ThemedText style={styles.optionCheck}>✓</ThemedText> : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
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
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 62,
    paddingHorizontal: Spacing.two + 3,
    paddingVertical: Spacing.two,
  },
  fieldTall: {
    minHeight: 92,
  },
  fieldFocused: {
    borderColor: Colors.light.accent,
  },
  fieldError: {
    borderColor: Colors.light.danger,
  },
  fieldPressed: {
    backgroundColor: Colors.light.backgroundSelected,
  },
  icon: {
    color: Colors.light.accent,
    fontSize: 15,
    width: 20,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  labelText: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  valueText: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.medium,
    fontSize: 14,
  },
  placeholderText: {
    color: Colors.light.textSecondary,
    fontFamily: Fonts.dm.regular,
  },
  chevron: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },

  // Select sheet
  modalBackdrop: {
    backgroundColor: 'rgba(17,26,67,0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: Spacing.xs,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    ...Shadows.card,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#d9d9e8',
    borderRadius: Radius.pill,
    height: 4,
    marginBottom: Spacing.two,
    width: 36,
  },
  sheetTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  option: {
    alignItems: 'center',
    borderColor: Colors.light.line,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.two + 2,
  },
  optionSelected: {
    backgroundColor: Colors.light.backgroundSelected,
    borderColor: Colors.light.text,
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionText: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.medium,
    fontSize: 13,
  },
  optionTextSelected: {
    fontFamily: Fonts.dm.bold,
  },
  optionCheck: {
    color: Colors.light.orange,
    fontFamily: Fonts.dm.bold,
    fontSize: 14,
  },
});
