import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { ReactNode } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/ui/icon';
import { AppTopbar } from '@/components/ui/app-topbar';
import { Colors, Fonts, Radius, Shadows, Spacing } from '@/constants/theme';

type ProfileRow = {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  danger?: boolean;
  onPress?: () => void;
};

type ProfileViewProps = {
  name: string;
  role: 'Student' | 'Staff';
  /** Avatar image; falls back to initials when omitted. */
  avatar?: ImageSourcePropType;
  initials: string;
  rows: ProfileRow[];
  onLogout: () => void;
  onBack: () => void;
  /** Role-specific bottom nav (student or staff). */
  nav: ReactNode;
};

/**
 * Shared profile screen (profile.webp, "Staff + Student"): big circular
 * avatar (photo or initials), name, orange-soft role badge with icon,
 * rounded settings rows with line icons and chevrons. The nav is injected
 * so both route groups reuse the identical layout.
 */
export function ProfileView({
  name,
  role,
  avatar,
  initials,
  rows,
  onLogout,
  onBack,
  nav,
}: ProfileViewProps) {
  return (
    <ThemedView style={styles.screen}>
      <View style={styles.safeArea}>
        <AppTopbar title="Profile" right="bell" onBack={onBack} />

        <View style={styles.content}>
          {/* Identity card (mockup: white card wrapping avatar + rows) */}
          <View style={styles.card}>
            <View style={styles.identity}>
              <View style={styles.avatarWrap}>
                {avatar ? (
                  <Image source={avatar} style={styles.avatarPhoto} />
                ) : (
                  <ThemedText style={styles.avatarText}>{initials}</ThemedText>
                )}
              </View>
              <ThemedText style={styles.name}>{name}</ThemedText>
              <View style={styles.roleBadge}>
                {role === 'Student' ? (
                  <Icon name="book-open" size={14} color="#a16b1d" />
                ) : (
                  <Icon name="briefcase" size={14} color="#a16b1d" />
                )}
                <ThemedText style={styles.roleText}>{role}</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

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
                  <Icon
                    name={row.icon}
                    size={20}
                    color={row.danger ? Colors.light.danger : 'text'}
                  />
                  <ThemedText style={[styles.rowLabel, row.danger && styles.rowDanger]}>
                    {row.label}
                  </ThemedText>
                  <Icon name="chevron-right" size={18} color="#8f91ab" />
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log Out"
                onPress={onLogout}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <Icon name="log-out" size={20} color={Colors.light.danger} />
                <ThemedText style={[styles.rowLabel, styles.rowDanger]}>Log Out</ThemedText>
                <Icon name="chevron-right" size={18} color="#8f91ab" />
              </Pressable>
            </View>
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

  content: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },

  // Identity card (mockup: one white card containing avatar + rows)
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingBottom: Spacing.three,
    ...Shadows.card,
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.three + 2,
    paddingTop: Spacing.four,
  },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    borderColor: Colors.light.line,
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  avatarText: {
    color: '#6c6dab',
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: 30,
  },
  avatarPhoto: {
    borderRadius: Radius.pill,
    height: '100%',
    width: '100%',
  },
  name: {
    fontFamily: Fonts.jakarta.bold,
    fontSize: 21,
    letterSpacing: -0.4,
  },
  roleBadge: {
    alignItems: 'center',
    backgroundColor: Colors.light.orangeSoft,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleText: {
    color: '#a16b1d',
    fontFamily: Fonts.dm.bold,
    fontSize: 13,
  },
  divider: {
    backgroundColor: Colors.light.line,
    height: 1,
    marginHorizontal: Spacing.three,
  },

  // Settings rows (mockup .profile-list)
  list: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  row: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 3,
    minHeight: 56,
    paddingHorizontal: Spacing.two + 4,
  },
  rowLabel: {
    color: Colors.light.text,
    flex: 1,
    fontFamily: Fonts.dm.semibold,
    fontSize: 14,
  },
  rowDanger: {
    color: Colors.light.danger,
  },
});
