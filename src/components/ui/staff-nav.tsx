import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';

export type StaffTab = 'home' | 'scan' | 'audit' | 'profile';

type StaffNavProps = {
  active: StaffTab;
  onSelect?: (tab: StaffTab) => void;
};

const tabs: { key: StaffTab; glyph: string; label: string }[] = [
  { key: 'home', glyph: '⌂', label: 'Home' },
  { key: 'scan', glyph: '⌾', label: 'Scan' },
  { key: 'audit', glyph: '▤', label: 'Audit' },
  { key: 'profile', glyph: '♙', label: 'Profile' },
];

/**
 * Staff bottom nav (mockup screen 07): floating pill with four flat tabs —
 * no raised ＋ like the student nav. Scan launches the QR flow.
 */
export function StaffNav({ active, onSelect }: StaffNavProps) {
  return (
    <View style={styles.nav} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={() => onSelect?.(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <ThemedText style={[styles.glyph, isActive && styles.glyphActive]}>
              {tab.glyph}
            </ThemedText>
            <ThemedText style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderColor: Colors.light.line,
    borderRadius: Radius.lg,
    borderWidth: 1,
    bottom: Spacing.two + 2,
    flexDirection: 'row',
    height: 62,
    justifyContent: 'space-around',
    left: Spacing.two + 3,
    position: 'absolute',
    right: Spacing.two + 3,
    ...Shadows.card,
  },
  tab: {
    alignItems: 'center',
    borderRadius: Radius.sm + 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.light.backgroundSelected,
  },
  glyph: {
    color: '#9799ae',
    fontSize: 17,
  },
  glyphActive: {
    color: Colors.light.text,
  },
  tabLabel: {
    color: '#9799ae',
    fontFamily: Fonts.dm.bold,
    fontSize: 10,
  },
  tabLabelActive: {
    color: Colors.light.text,
  },
});
