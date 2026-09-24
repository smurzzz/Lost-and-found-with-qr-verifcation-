/**
 * Student Profile — v3 port (Profile, student role).
 */

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CircleHelp, ChevronRight, Settings } from 'lucide-react-native';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, Header } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { initialsOf, useSession } from '@/lib/session';
import { tabRoute } from '@/lib/v3-nav';

export default function StudentProfileScreen() {
  const role = 'student' as const;
  const { dbUser, clerkUser, isDemo, setDemoRole, signOut } = useSession();

  const name = dbUser?.name ?? clerkUser?.name ?? 'Alex Morgan';
  const initials = initialsOf(name);

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  return (
    <V3Screen
      nav={
        <BottomNav3
          role={role}
          active="profile"
          onSelect={(tab) => router.push(tabRoute(role, tab))}
        />
      }
    >
      <Header title="Profile" />
      <View style={styles.body}>
        <View style={[styles.avatar, Shadows.brand]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>student</Text>
        </View>

        {isDemo && (
          <View style={styles.toggle}>
            <View style={[styles.toggleButton, styles.toggleActive]}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>Student</Text>
            </View>
            <Pressable
              style={styles.toggleButton}
              onPress={() => {
                setDemoRole?.('staff');
                router.replace('/(staff)/dashboard');
              }}
            >
              <Text style={styles.toggleText}>Staff preview</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.settings, Shadows.card]}>
          <View style={styles.settingsRow}>
            <Settings size={20} color={Colors.mutedForeground} />
            <Text style={styles.settingsLabel}>Notification Settings</Text>
            <ChevronRight size={20} color={Colors.mutedForeground} />
          </View>
          <View style={[styles.settingsRow, styles.settingsRowLast]}>
            <CircleHelp size={20} color={Colors.mutedForeground} />
            <Text style={styles.settingsLabel}>Help &amp; Support</Text>
            <ChevronRight size={20} color={Colors.mutedForeground} />
          </View>
        </View>

        <Button3
          label="Log Out"
          variant="ghost"
          height={52}
          style={styles.logout}
          textStyle={styles.logoutText}
          onPress={handleLogout}
        />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.primaryForeground,
  },
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
