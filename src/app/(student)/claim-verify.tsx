/**
 * Verify Your Claim — v3 port (ClaimScreen). Item summary card +
 * distinctive-detail textarea → claim success.
 */

import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Image } from 'expo-image';

import { Colors, Fonts, Radius, Shadows } from '@/constants/design';
import { Button3, Header, StatusPill, TextArea3 } from '@/components/v3/core';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { V3Screen } from '@/components/v3/screen';
import { tabRoute } from '@/lib/v3-nav';
import { items } from '@/mocks/data';

export default function ClaimVerifyScreen() {
  const [detail, setDetail] = useState('');
  const item = items[1]; // White headphones, per the source.

  return (
    <V3Screen
      nav={
        <BottomNav3
          role="student"
          active="home"
          onSelect={(tab) => router.push(tabRoute('student', tab))}
        />
      }
    >
      <Header title="Verify Your Claim" onBack={() => router.push('/(student)/home')} />
      <View style={styles.body}>
        <View style={[styles.itemCard, Shadows.card]}>
          <Image source={item.image} style={styles.itemImage} contentFit="cover" transition={0} />
          <View style={styles.itemBody}>
            <View style={styles.itemTop}>
              <View style={styles.itemText}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.category} · {item.location}
                </Text>
              </View>
              <StatusPill status="pending" />
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.question}>What&apos;s distinctive about this item?</Text>
          <Text style={styles.hint}>
            Tell staff something that isn&apos;t obvious from the listing.
          </Text>
          <TextArea3
            placeholder="For example: a small scratch under the left ear cup..."
            value={detail}
            onChangeText={setDetail}
            minHeight={128}
            style={styles.textarea}
          />
        </View>

        <Button3 label="Submit Claim" onPress={() => router.push('/(student)/claim-success')} />
      </View>
    </V3Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16 },
  itemCard: {
    overflow: 'hidden',
    borderRadius: Radius.card,
    backgroundColor: Colors.card,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 2 / 1,
  },
  itemBody: { padding: 16 },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemText: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  question: {
    marginTop: 24,
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.foreground,
  },
  hint: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  textarea: { marginTop: 12 },
});
