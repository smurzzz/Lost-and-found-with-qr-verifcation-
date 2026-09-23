import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';

export type NavTab = 'home' | 'search' | 'add' | 'notifications' | 'profile';

type BottomNavProps = {
  active: NavTab;
  onSelect?: (tab: NavTab) => void;
  onAdd?: () => void;
};

const tabs: { key: NavTab; glyph: string; label: string }[] = [
  { key: 'home', glyph: '⌂', label: 'Home' },
  { key: 'search', glyph: '⌕', label: 'Search' },
  { key: 'notifications', glyph: '♧', label: 'Alerts' },
  { key: 'profile', glyph: '♙', label: 'Profile' },
];

/**
 * Floating pill nav with the raised orange ＋ (mockup .bottom-nav).
 * Placeholder routes until the Phase 1.4 navigation pass wires them up.
 */
export function BottomNav({ active, onSelect, onAdd }: BottomNavProps) {
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  const renderTab = (tab: { key: NavTab; glyph: string; label: string }) => {
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
        <ThemedText style={[styles.glyph, isActive && styles.glyphActive]}>{tab.glyph}</ThemedText>
        <ThemedText style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {tab.label}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={styles.nav} accessibilityRole="tablist">
      {left.map(renderTab)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add new report"
        onPress={onAdd}
        style={({ pressed }) => [styles.plus, pressed && { opacity: 0.85 }]}
      >
        <ThemedText style={styles.plusGlyph}>＋</ThemedText>
      </Pressable>
      {right.map(renderTab)}
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
  plus: {
    alignItems: 'center',
    backgroundColor: Colors.light.orange,
    borderRadius: Radius.pill,
    height: 48,
    justifyContent: 'center',
    marginTop: -18,
    width: 48,
    ...Shadows.float,
  },
  plusGlyph: {
    color: '#ffffff',
    fontFamily: Fonts.jakarta.bold,
    fontSize: 22,
  },
});
