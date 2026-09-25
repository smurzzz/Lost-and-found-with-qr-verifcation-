/**
 * V3 screen shell: scrollable content area with the v3 bottom nav pinned
 * below (mirrors the Lovable app's device frame column).
 *
 * Wrapped in SafeAreaView (top + bottom) so content and the nav clear the
 * Android status bar / gesture nav bar under SDK 54+ enforced edge-to-edge.
 */

import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  // Keep the floating action button the same distance above the nav, which is
  // now taller by the bottom system-bar inset.
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
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
      {floating ? (
        <View style={[styles.floating, { bottom: 96 + insets.bottom }]}>{floating}</View>
      ) : null}
    </SafeAreaView>
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
