import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Colors, Fonts, Spacing } from '@/constants/theme';

type AppTopbarProps = {
  title: string;
  /** Hides the back chevron (e.g. dashboard). */
  noBack?: boolean;
  /** Right slot: bell with unread dot (default on sub-pages), chat, or none. */
  right?: 'bell' | 'chat' | 'none';
  onBack?: () => void;
};

/**
 * V2 topbar (all 2025-09 mockups): round back arrow, bold centered title,
 * right utility icon — bell with orange unread dot or chat bubble.
 */
export function AppTopbar({ title, noBack = false, right = 'none', onBack }: AppTopbarProps) {
  const router = useRouter();

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {!noBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack ?? (() => router.back())}
            hitSlop={12}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Icon name="arrow-left" size={24} color="text" />
          </Pressable>
        ) : null}
      </View>
      <ThemedText style={styles.title} numberOfLines={1}>
        {title}
      </ThemedText>
      <View style={[styles.side, styles.sideRight]}>
        {right === 'bell' ? (
          <View style={styles.bellWrap}>
            <Icon name="bell" size={22} color="text" />
            <View style={styles.dot} />
          </View>
        ) : null}
        {right === 'chat' ? <Icon name="message-circle" size={22} color="text" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    marginBottom: Spacing.three,
  },
  side: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
    color: Colors.light.text,
    fontFamily: Fonts.jakarta.bold,
    fontSize: 22,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  bellWrap: {
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  dot: {
    backgroundColor: Colors.light.orange,
    borderColor: Colors.light.lavender,
    borderRadius: 5,
    height: 10,
    position: 'absolute',
    right: 9,
    top: 9,
    width: 10,
  },
});
