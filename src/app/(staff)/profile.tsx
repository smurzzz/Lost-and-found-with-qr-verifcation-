/**
 * Staff Profile — v3 (Profile, staff role). Renders the shared ProfileView
 * body with the staff bottom nav; all layout lives in
 * components/v3/profile-view.tsx.
 */

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Header } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { ProfileView } from '@/components/v3/profile-view';
import { useSession } from '@/lib/session';
import { tabRoute } from '@/lib/v3-nav';

export default function StaffProfileScreen() {
  const role = 'staff' as const;
  const { dbUser, user, isDemo, canSwitchViews, setDemoRole, setViewRole, signOut } = useSession();
  const queryClient = useQueryClient();

  const name = dbUser?.name ?? user?.name ?? 'Maya Chen';

  async function handleLogout() {
    queryClient.clear();
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
        <ProfileView
          role={role}
          name={name}
          avatarUri={user?.imageUrl ?? null}
          isDemo={isDemo}
          canSwitchViews={canSwitchViews}
          setDemoRole={setDemoRole}
          setViewRole={setViewRole}
          onLogout={() => void handleLogout()}
        />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16 },
});
