import { Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type ProfileRow = {
  glyph: string;
  label: string;
  danger?: boolean;
  onPress?: () => void;
};

type ProfileViewProps = {
  name: string;
  initials: string;
  role: 'Student' | 'Staff';
  email: string;
  rows: ProfileRow[];
  onLogout: () => void;
  onBack: () => void;
  /** Role-specific bottom nav (student or staff). */
  nav: ReactNode;
};

/**
 * Shared profile screen (mockup screen 13, "Staff + Student"): big initials
 * avatar, name, role badge, email, settings rows, brand footer. The nav is
 * injected so both route groups reuse the identical layout.
 */
export function ProfileView({
  name,
  initials,
  role,
  email,
  rows,
  onLogout,
  onBack,
  nav,
}: ProfileViewProps) {
  return (
    <ThemedView style={styles.screen}>
      <View style={styles.safeArea}>
        {/* Topbar (mockup .topbar): back, title, menu */}
        <View style={styles.topbar}>
          <ThemedText accessibilityRole="button" style={styles.backGlyph} onPress={onBack}>
            ‹
          </ThemedText>
          <ThemedText style={styles.topbarTitle}>Profile</ThemedText>
          <ThemedText style={styles.menuGlyph}>⋯</ThemedText>
        </View>

        <View style={styles.content}>
          {/* Identity (mockup .profile) */}
          <View style={styles.identity}>
            <View style={styles.bigAvatar}>
              <ThemedText style={styles.bigAvatarText}>{initials}</ThemedText>
            </View>
            <ThemedText style={styles.name}>{name}</ThemedText>
            <StatusBadge label={role} tone="navy" />
            <ThemedText type="small" themeColor="textSecondary" style={styles.email}>
              {email}
            </ThemedText>
          </View>

          {/* Settings rows (mockup .profile-list) */}
          <View style={styles.list}>
            {rows.map((row) => (
              <Pressable
                key={row.label}
                accessibilityRole="button"
                accessibilityLabel={row.label}
                onPress={row.onPress}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <ThemedText style={[styles.rowGlyph, row.danger && styles.rowDanger]}>
                  {row.glyph}
                </ThemedText>
                <ThemedText style={[styles.rowLabel, row.danger && styles.rowDanger]}>
                  {row.label}
                </ThemedText>
                <ThemedText style={[styles.rowChevron, row.danger && styles.rowDanger]}>
                  ›
                </ThemedText>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log Out"
              onPress={onLogout}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
              <ThemedText style={[styles.rowGlyph, styles.rowDanger]}>×</ThemedText>
              <ThemedText style={[styles.rowLabel, styles.rowDanger]}>Log Out</ThemedText>
              <ThemedText style={[styles.rowChevron, styles.rowDanger]}>›</ThemedText>
            </Pressable>
          </View>

          {/* Brand footer (mockup .profile-footer) */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerBrand}>
              ✓&nbsp;&nbsp;claim<ThemedText style={styles.footerAccent}>it</ThemedText>
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.footerTagline}>
              Trust made simple.
            </ThemedText>
          </View>
        </View>

        {nav}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.lavender,
  },
  safeArea: {
    flex: 1,
  },
  topbar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  backGlyph: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.regular,
    fontSize: 30,
    lineHeight: 34,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  topbarTitle: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 14,
  },
  menuGlyph: {
    color: Colors.light.text,
    fontSize: 18,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },

  // Identity (mockup .profile)
  identity: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.four,
    paddingTop: Spacing.four,
  },
  bigAvatar: {
    alignItems: 'center',
    backgroundColor: Colors.light.text,
    borderRadius: Radius.pill,
    height: 70,
    justifyContent: 'center',
    marginBottom: Spacing.two,
    width: 70,
  },
  bigAvatarText: {
    color: '#ffffff',
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: 19,
  },
  name: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 17,
    letterSpacing: 0,
    marginBottom: Spacing.half,
  },
  email: {
    marginTop: Spacing.half,
  },

  // Settings rows (mockup .profile-list)
  list: {
    gap: Spacing.two,
  },
  row: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 1,
    minHeight: 48,
    padding: Spacing.two + 5,
  },
  rowGlyph: {
    color: Colors.light.text,
    fontSize: 14,
    width: 20,
  },
  rowLabel: {
    color: Colors.light.text,
    flex: 1,
    fontSize: 14,
  },
  rowChevron: {
    color: Colors.light.textSecondary,
    fontSize: 16,
  },
  rowDanger: {
    color: Colors.light.danger,
  },

  // Brand footer (mockup .profile-footer)
  footer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.four + 10,
    paddingTop: Spacing.five,
  },
  footerBrand: {
    color: '#7374a2',
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: 13,
    letterSpacing: -0.3,
  },
  footerAccent: {
    color: Colors.light.orange,
  },
  footerTagline: {
    fontSize: 11,
    marginTop: Spacing.half,
  },
});
