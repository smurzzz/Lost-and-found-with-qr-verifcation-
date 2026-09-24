import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, Ionicons } from '@/components/ui/icon';
import { brand, Fonts } from '@/constants/theme';

export type NavTab = 'home' | 'search' | 'report' | 'alerts' | 'profile';

type BottomNavProps = {
  /** Highlighted tab (navy); omit for screens outside the five tabs. */
  active?: NavTab;
  /**
   * Exclusive tab handler. When provided the screen fully controls routing
   * (staff screens map Home to the dashboard); otherwise the student
   * defaults apply.
   */
  onSelect?: (tab: NavTab) => void;
};

const tabs: { key: NavTab; icon: React.ComponentProps<typeof Icon>['name']; label: string }[] = [
  { key: 'home', icon: 'home', label: 'Home' },
  { key: 'search', icon: 'search', label: 'Search' },
  { key: 'report', icon: 'plus', label: 'Report' },
  { key: 'alerts', icon: 'bell', label: 'Alerts' },
  { key: 'profile', icon: 'user', label: 'Profile' },
];

/**
 * V3 bottom nav (2026 home-feed mockup): five tabs, navy active, centered
 * raised orange Report ＋. Search/Alerts have no Phase 1 screens and stay
 * inert.
 */
export function BottomNav({ active, onSelect }: BottomNavProps) {
  const router = useRouter();

  const defaultSelect = (tab: NavTab) => {
    switch (tab) {
      case 'home':
        router.replace('/(student)/home');
        break;
      case 'report':
        router.push('/(student)/report-found');
        break;
      case 'profile':
        router.push('/(student)/profile');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.nav} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isReport = tab.key === 'report';
        const isHome = tab.key === 'home';
        const isActive = active === tab.key;
        const color = isReport ? brand.orange : isActive ? brand.navy : brand.textSubtle;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={() => (onSelect ? onSelect(tab.key) : defaultSelect(tab.key))}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            {isReport ? (
              <LinearGradient
                colors={['#F59E0B', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reportCircle}
              >
                <Icon name="plus" size={26} color="#ffffff" />
              </LinearGradient>
            ) : isHome ? (
              <Ionicons name={isActive ? 'home' : 'home-outline'} size={23} color={color} />
            ) : (
              <Icon name={tab.icon} size={23} color={color} />
            )}
            <ThemedText style={[styles.label, { color }, isActive && styles.labelActive]}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopColor: 'rgba(226,232,240,0.8)',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    height: 86,
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 14,
    position: 'absolute',
    right: 0,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    justifyContent: 'flex-end',
    minHeight: 52,
    paddingTop: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  reportCircle: {
    alignItems: 'center',
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: -34,
    shadowColor: brand.orange,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    width: 56,
  },
  label: {
    fontFamily: Fonts.dm.medium,
    fontSize: 11,
    letterSpacing: -0.2,
  },
  labelActive: {
    fontFamily: Fonts.dm.semibold,
  },
});
