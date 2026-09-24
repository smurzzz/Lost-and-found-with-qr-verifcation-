/**
 * Search — v3 port (Feed with searchOnly). Shared by both roles; the nav
 * differs (staff gets the staff nav via role prop below).
 */

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Header } from '@/components/v3/core';
import { Feed } from '@/components/v3/feed';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { useFoundItems } from '@/lib/hooks/use-items';
import { useSession } from '@/lib/session';

export default function SearchScreen() {
  const { isDemo, role } = useSession();
  const currentRole = role === 'staff' ? 'staff' : 'student';
  const foundItems = useFoundItems({ enabled: !isDemo });

  return (
    <V3Screen
      nav={
        <BottomNav3
          role={currentRole}
          active="search"
          onSelect={(tab) => router.push(tabRoute(currentRole, tab))}
        />
      }
    >
      <Header title="Search" subtitle="Browse every found item in one place." />
      <View style={styles.feed}>
        <Feed
          staff={currentRole === 'staff'}
          searchOnly
          dbItems={isDemo ? undefined : foundItems.data}
          dbLoading={!isDemo && foundItems.isLoading}
          onMine={() => router.push('/(student)/claim-verify')}
        />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  feed: { flex: 1 },
});
