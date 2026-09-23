import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type PlaceholderScreenProps = {
  title: string;
  note: string;
};

/**
 * Temporary Phase 1 stub for screens whose mockups haven't been implemented
 * yet. Replaced screen-by-screen as the mockups arrive.
 */
export default function PlaceholderScreen({ title, note }: PlaceholderScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <View style={styles.content}>
          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {note}
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  content: {
    gap: Spacing.two,
    padding: Spacing.four,
  },
});
