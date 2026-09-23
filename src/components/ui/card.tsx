import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

type CardProps = ViewProps & {
  /** Padding override; defaults to the mockup card padding. */
  padded?: boolean;
};

/** White rounded card surface used for items, forms, and sheets. */
export function Card({ style, padded = true, ...rest }: CardProps) {
  return <View style={[styles.card, padded && styles.padded, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.line,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadows.card,
  },
  padded: {
    padding: Spacing.three,
  },
});
