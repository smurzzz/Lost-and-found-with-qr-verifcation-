/**
 * Form pickers: CategorySelect (dropdown sheet) and DatePickerField
 * (native calendar via @react-native-community/datetimepicker).
 * Both render as FormField-style rows with trailing chevron/clock icons.
 */

import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, ChevronDown, Clock3 } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '@/constants/design';

export const CATEGORY_OPTIONS = ['Electronics', 'Bags', 'Clothing', 'IDs/Cards', 'Other'] as const;

/* ------------------------------------------------------------------ */
/* CategorySelect                                                      */
/* ------------------------------------------------------------------ */

export function CategorySelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (category: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={styles.label}>Category</Text>
      <Pressable
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={() => setOpen(true)}
        accessibilityLabel="Select a category"
      >
        <Text style={[styles.value, value ? null : styles.placeholder]}>
          {value || 'Select a category'}
        </Text>
        <ChevronDown size={20} color={Colors.mutedForeground} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choose a category</Text>
            <ScrollView style={styles.optionsScroll}>
              {CATEGORY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={styles.option}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, value === option ? styles.optionActive : null]}>
                    {option}
                  </Text>
                  {value === option ? <Check size={18} color={Colors.primary} /> : null}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* DatePickerField                                                     */
/* ------------------------------------------------------------------ */

function formatLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DatePickerField({
  value,
  onChange,
  error,
  label,
  maximumDate,
}: {
  /** ISO string or '' when unset. */
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  label: string;
  /** e.g. found reports cannot be in the future. */
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : new Date();

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={() => setOpen(true)}
        accessibilityLabel={`${label} — open calendar`}
      >
        <Text style={[styles.value, value ? null : styles.placeholder]}>
          {value ? formatLabel(selected) : 'Pick a date'}
        </Text>
        <Clock3 size={20} color={Colors.mutedForeground} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          onChange={(_event, date) => {
            setOpen(false);
            if (date) onChange(date.toISOString());
          }}
        />
      ) : null}
      {open && Platform.OS === 'web' ? (
        <Modal transparent visible animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <View style={styles.webDateWrap}>
                <input
                  type="date"
                  value={value ? value.slice(0, 10) : ''}
                  max={maximumDate ? maximumDate.toISOString().slice(0, 10) : undefined}
                  onChange={(event) => {
                    const picked = event.target.value;
                    if (picked) onChange(new Date(`${picked}T12:00:00`).toISOString());
                  }}
                  style={{
                    fontSize: 16,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #e4e4e7',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </View>
              <Pressable
                style={styles.cancel}
                onPress={() => {
                  setOpen(false);
                }}
              >
                <Text style={styles.cancelText}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Modal transparent visible animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.iosBackdrop} onPress={() => setOpen(false)}>
            <View style={styles.iosSheet}>
              <DateTimePicker
                value={selected}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                onChange={(_event, date) => {
                  if (date) onChange(date.toISOString());
                }}
              />
              <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
                <Text style={styles.cancelText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
  },
  fieldError: { borderColor: Colors.destructive },
  value: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: Colors.foreground },
  placeholder: { color: Colors.mutedForeground },
  error: { marginTop: 6, fontSize: 12, color: Colors.destructive },

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
    maxHeight: 420,
    borderRadius: 16,
    backgroundColor: Colors.card,
    padding: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
    marginBottom: 8,
  },
  optionsScroll: { maxHeight: 260 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionText: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.foreground },
  optionActive: { fontFamily: Fonts.bold, color: Colors.primary },
  cancel: { alignItems: 'center', paddingTop: 12 },
  cancelText: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.mutedForeground },

  webDateWrap: { paddingVertical: 8 },
  iosBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  iosSheet: {
    backgroundColor: Colors.card,
    paddingBottom: 24,
  },
});
