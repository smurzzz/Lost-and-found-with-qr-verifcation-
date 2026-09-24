import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type InfoBannerProps = {
  tone?: 'amber' | 'green' | 'info';
  title: string;
  detail: string;
  /** Amber banner uses a filled orange clock disc (mockup). */
  icon?: React.ComponentProps<typeof Icon>['name'];
};

const tones = {
  amber: { bg: Colors.light.orangeSoft, border: '#f8d796', title: '#956619', detail: '#9a7d4b' },
  green: { bg: Colors.light.greenSoft, border: '#bfe8d9', title: '#0b8762', detail: '#5d6d68' },
  info: { bg: '#eceafc', border: '#e2e0f6', title: Colors.light.text, detail: '#54558f' },
};

/**
 * Notice banner (report-found amber "Pending drop-off", qr-tag green
 * "Item received by staff"): filled icon disc + bold title + detail line.
 */
export function InfoBanner({ tone = 'amber', title, detail, icon }: InfoBannerProps) {
  const t = tones[tone];
  const iconName =
    icon ?? (tone === 'amber' ? 'clock' : tone === 'green' ? 'check-circle' : 'info');
  return (
    <View style={[styles.banner, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View
        style={[
          styles.iconDisc,
          {
            backgroundColor:
              tone === 'amber'
                ? Colors.light.orange
                : tone === 'green'
                  ? Colors.light.green
                  : Colors.light.orange,
          },
        ]}
      >
        <Icon name={iconName} size={18} color="#ffffff" />
      </View>
      <View style={styles.textCol}>
        <ThemedText style={[styles.title, { color: t.title }]}>{title}</ThemedText>
        <ThemedText style={[styles.detail, { color: t.detail }]}>{detail}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two + 2,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two + 2,
  },
  iconDisc: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  textCol: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontFamily: Fonts.dm.bold,
    fontSize: 13,
  },
  detail: {
    fontSize: 11,
    lineHeight: 15,
  },
});
