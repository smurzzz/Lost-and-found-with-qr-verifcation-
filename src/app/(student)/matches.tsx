/**
 * Possible Matches — v3 port (Matches). Pending banner + two item cards.
 */

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/design';
import { Header } from '@/components/v3/core';
import { ItemCard } from '@/components/v3/feed';
import { V3Screen } from '@/components/v3/screen';
import { items } from '@/mocks/data';

export default function MatchesScreen() {
  return (
    <V3Screen>
      <Header
        title="Possible Matches"
        subtitle="We found items that may match your lost report."
        onBack={() => router.push('/(student)/notifications')}
      />
      <View style={styles.list}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>White headphones</Text>
          <Text style={styles.bannerMeta}>Lost Sep 21 · 2 possible matches</Text>
        </View>
        {items.slice(1, 3).map((item) => (
          <View key={item.id}>
            <ItemCard
              item={item}
              onMine={() => router.push('/(student)/claim-verify')}
              onDismiss={() => undefined}
            />
            {item.status === 'dropoff' ? (
              <Text style={styles.awaitNote}>
                Awaiting staff confirmation — you can still claim it now.
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16, paddingHorizontal: 16 },
  banner: {
    borderRadius: Radius.input,
    backgroundColor: Colors.pendingSoft,
    padding: 16,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.pendingForeground,
  },
  bannerMeta: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.pendingForeground,
  },
  awaitNote: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.mutedForeground,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: Radius.card,
    borderBottomRightRadius: Radius.card,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -8,
  },
});
