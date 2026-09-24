/**
 * V3 screen shell: scrollable content area with the v3 bottom nav pinned
 * below (mirrors the Lovable app's device frame column).
 */

import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/design';

export function V3Screen({
  children,
  nav,
  scroll = true,
  refreshing = false,
  onRefresh,
  floating,
}: {
  children: ReactNode;
  nav?: ReactNode;
  scroll?: boolean;
  /** Pull-to-refresh: enables the spinner when `onRefresh` is provided. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Fixed action button overlaid above the nav (e.g. a floating "+"). */
  floating?: ReactNode;
}) {
  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          bounces={Boolean(onRefresh)}
          alwaysBounceVertical={Boolean(onRefresh)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
      {nav}
      {floating ? <View style={styles.floating}>{floating}</View> : null}
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
  floating: {
    position: 'absolute',
    right: 16,
    bottom: 96,
    zIndex: 10,
  },
});
