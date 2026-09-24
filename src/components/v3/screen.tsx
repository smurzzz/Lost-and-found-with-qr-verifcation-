/**
 * V3 screen shell: scrollable content area with the v3 bottom nav pinned
 * below (mirrors the Lovable app's device frame column).
 */

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/design';

export function V3Screen({
  children,
  nav,
  scroll = true,
}: {
  children: ReactNode;
  nav?: ReactNode;
  scroll?: boolean;
}) {
  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
      {nav}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  fill: { flex: 1 },
});
