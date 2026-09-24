import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';

type FormFieldProps = {
  /** Leading line icon (mockups: tag, message-circle, map-pin, calendar…). */
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value?: string;
  /** Empty-state placeholder text (mockup: "Select a category"). */
  placeholder?: string;
  /** Select-like fields press through and show the chevron. */
  onPress?: () => void;
  children?: React.ReactNode;
  /** Multi-line variant (descriptions). */
  tall?: boolean;
  error?: string | null;
  focused?: boolean;
  /** Chevron direction on select fields (mockup: down for Category). */
  chevron?: 'right' | 'down';
  /** Trailing adornment icon (mockup: calendar on the date field). */
  trailingIcon?: React.ComponentProps<typeof Icon>['name'];
};

/**
 * V2 form row (report/claim mockups 2025-09): rounded outline field with a
 * periwinkle line icon, muted label on top and value/placeholder underneath,
 * chevron-right on select fields. Either pass `onPress` (select-like fields)
 * or `children` (a TextInput).
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
  chevron = 'right',
  trailingIcon,
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
        <View style={styles.iconWrap}>
          <Icon name={icon} size={20} color="accent" />
        </View>
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
        {trailingIcon ? <Icon name={trailingIcon} size={19} color="#8f91ab" /> : null}
        {onPress && !trailingIcon ? (
          <View style={styles.chevronWrap}>
            <Icon
              name={chevron === 'down' ? 'chevron-down' : 'chevron-right'}
              size={18}
              color="#a9aac4"
            />
          </View>
        ) : null}
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
                {isSelected ? <Icon name="check" size={16} color="orange" /> : null}
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
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 4,
    minHeight: 68,
    paddingHorizontal: Spacing.two + 6,
    paddingVertical: Spacing.two + 2,
  },
  fieldTall: {
    minHeight: 96,
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
  iconWrap: {
    width: 24,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  labelText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  valueText: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.medium,
    fontSize: 15,
  },
  placeholderText: {
    color: '#a9aac4',
    fontFamily: Fonts.dm.regular,
  },
  chevronWrap: {
    width: 20,
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
});
