import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Colors, Fonts, Spacing } from '@/constants/theme';

type DetailRowProps = {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
};

/**
 * Mockup detail line: periwinkle line icon, small muted label on top,
 * navy value underneath (match cards, claim, receipt, QR tag, audit).
 */
export function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={16} />
      </View>
      <View style={styles.textCol}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={styles.value} numberOfLines={2}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 4,
  },
  iconWrap: {
    paddingTop: 1,
    width: 20,
  },
  textCol: {
    flex: 1,
    gap: 1,
  },
  label: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  value: {
    color: Colors.light.text,
    fontFamily: Fonts.dm.medium,
    fontSize: 13,
  },
});
