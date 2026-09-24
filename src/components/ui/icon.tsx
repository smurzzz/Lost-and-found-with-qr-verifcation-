import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';

import { Colors, type ThemeColor } from '@/constants/theme';

type IconProps = {
  /** Feather icon name (line style, matching the mockups). */
  name: React.ComponentProps<typeof Feather>['name'];
  size?: number;
  color?: ThemeColor | string;
};

/**
 * App-wide line icon. The mockups use Feather-style outline icons
 * (tag, map-pin, calendar, bell, …) tinted periwinkle or navy.
 */
export function Icon({ name, size = 20, color = 'accent' }: IconProps) {
  const resolved = color in Colors.light ? Colors.light[color as ThemeColor] : color;
  return <Feather name={name} size={size} color={resolved} />;
}

export { Ionicons };
