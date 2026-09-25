/**
 * Shared profile screen body (student + staff). The two v3 profiles rendered
 * an identical layout — avatar, name, role badge, the demo role toggle or the
 * real staff/user view switch, settings rows, logout — that had drifted into
 * two copies. This is the single source; the screens only supply session data
 * and the role-specific nav.
 */

import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Image } from 'expo-image';
import { ChevronRight, CircleHelp, Settings, ShieldCheck, User } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3 } from '@/components/v3/core';
import { initialsOf } from '@/lib/utils';

const HELP_MAILTO = 'mailto:lionelcueva12345@gmail.com?subject=ClaimIt%20Help';

export function ProfileView({
  role,
  name,
  avatarUri,
  isDemo,
  canSwitchViews,
  setDemoRole,
  setViewRole,
  onLogout,
}: {
  role: 'student' | 'staff';
  name: string;
  /** Clerk/Google profile photo, when the account has one. */
  avatarUri: string | null;
  isDemo: boolean;
  canSwitchViews: boolean;
  setDemoRole?: (role: 'student' | 'staff') => void;
  setViewRole?: (role: 'student' | 'staff') => void;
  onLogout: () => void;
}) {
  const initials = initialsOf(name);
  const otherRole = role === 'student' ? 'staff' : 'student';

  return (
    <>
      <View style={[styles.avatar, Shadows.brand]}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{role}</Text>
      </View>

      {isDemo && (
        <View style={styles.toggle}>
          {role === 'student' ? (
            <View style={[styles.toggleButton, styles.toggleActive]}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>Student</Text>
            </View>
          ) : (
            <Pressable
              style={styles.toggleButton}
              onPress={() => {
                setDemoRole?.('student');
                router.replace('/(student)/home');
              }}
            >
              <Text style={styles.toggleText}>Student</Text>
            </Pressable>
          )}
          {role === 'staff' ? (
            <View style={[styles.toggleButton, styles.toggleActive]}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>Staff preview</Text>
            </View>
          ) : (
            <Pressable
              style={styles.toggleButton}
              onPress={() => {
                setDemoRole?.('staff');
                router.replace('/(staff)/dashboard');
              }}
            >
              <Text style={styles.toggleText}>Staff preview</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Real staff/admin can switch which role's UI they are browsing. */}
      {!isDemo && canSwitchViews && (
        <Pressable
          style={[styles.viewButton, Shadows.card]}
          onPress={() => {
            setViewRole?.(otherRole);
            router.replace(otherRole === 'staff' ? '/(staff)/dashboard' : '/(student)/home');
          }}
        >
          {otherRole === 'staff' ? (
            <ShieldCheck size={20} color={Colors.primary} />
          ) : (
            <User size={20} color={Colors.primary} />
          )}
          <Text style={[styles.viewText, { color: Colors.primary }]}>
            {otherRole === 'staff' ? 'Staff view' : 'User view'}
          </Text>
          <ChevronRight size={20} color={Colors.mutedForeground} />
        </Pressable>
      )}

      <View style={[styles.settings, Shadows.card]}>
        <Pressable style={styles.settingsRow} onPress={() => void Linking.openSettings()}>
          <Settings size={20} color={Colors.mutedForeground} />
          <Text style={styles.settingsLabel}>Notification Settings</Text>
          <ChevronRight size={20} color={Colors.mutedForeground} />
        </Pressable>
        <Pressable
          style={[styles.settingsRow, styles.settingsRowLast]}
          onPress={() => void Linking.openURL(HELP_MAILTO)}
        >
          <CircleHelp size={20} color={Colors.mutedForeground} />
          <Text style={styles.settingsLabel}>Help &amp; Support</Text>
          <ChevronRight size={20} color={Colors.mutedForeground} />
        </Pressable>
      </View>

      <Button3
        label="Log Out"
        variant="ghost"
        height={52}
        style={styles.logout}
        textStyle={styles.logoutText}
        onPress={onLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.primaryForeground,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 48 },
  name: {
    marginTop: 16,
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: 8,
    alignSelf: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  toggle: {
    marginTop: 24,
    flexDirection: 'row',
    borderRadius: Radius.input,
    backgroundColor: Colors.muted,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  toggleTextActive: { color: Colors.primaryForeground },
  viewButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    minHeight: 60,
    paddingHorizontal: 16,
  },
  viewText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  settings: {
    marginTop: 24,
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  logout: { marginTop: 20 },
  logoutText: { color: Colors.destructive },
});
