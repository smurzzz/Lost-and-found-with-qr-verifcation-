import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Placeholder for the full Student Home (mock feed, chips, Mine/Not mine).
 * The complete screen lands with the next mockup in this Phase 1 series.
 */
export default function StudentHomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <View style={styles.content}>
          <ThemedText type="subtitle">Student Home</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Login flow verified. The full mock feed screen is next in Phase 1.
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
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
