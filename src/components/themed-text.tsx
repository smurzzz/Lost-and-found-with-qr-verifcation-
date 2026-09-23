import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

/**
 * Typography scale from the mockups: Plus Jakarta Sans for headings/wordmark,
 * DM Sans for body. Sizes are the prototype phone-frame values scaled ~1.5×
 * to real device points.
 */
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: Fonts.dm.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  smallBold: {
    fontFamily: Fonts.dm.bold,
    fontSize: 13,
    lineHeight: 19,
  },
  default: {
    fontFamily: Fonts.dm.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -1.4,
  },
  subtitle: {
    fontFamily: Fonts.jakarta.extrabold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.9,
  },
  link: {
    fontFamily: Fonts.dm.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.accent,
  },
  linkPrimary: {
    fontFamily: Fonts.dm.bold,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.orange,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
