/**
 * ClaimIt v3 BottomNav — ported 1:1 from the Lovable source. Student nav:
 * Home/Search/Report(+) /Notifications/Profile. Staff nav:
 * Home/Search/Scan/Audit Log/Profile. The center tile is raised (-mt-7).
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Bell, ClipboardClock, Home, Plus, ScanLine, Search, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Colors, Fonts, Shadows } from '@/constants/design';

export type StudentTab = 'home' | 'search' | 'report' | 'notifications' | 'profile';
export type StaffTab = 'staff-home' | 'search' | 'scan' | 'audit' | 'profile';

type NavItem = {
  label: string;
  icon: LucideIcon;
  tab: string;
  center?: boolean;
};

export function BottomNav3({
  role,
  active,
  onSelect,
}: {
  role: 'student' | 'staff';
  active: string;
  onSelect: (tab: string) => void;
}) {
  const nav: NavItem[] =
    role === 'student'
      ? [
          { label: 'Home', icon: Home, tab: 'home' },
          { label: 'Search', icon: Search, tab: 'search' },
          { label: 'Report', icon: Plus, tab: 'report', center: true },
          { label: 'Notifications', icon: Bell, tab: 'notifications' },
          { label: 'Profile', icon: User, tab: 'profile' },
        ]
      : [
          { label: 'Home', icon: Home, tab: 'staff-home' },
          { label: 'Search', icon: Search, tab: 'search' },
          { label: 'Scan', icon: ScanLine, tab: 'scan', center: true },
          { label: 'Audit Log', icon: ClipboardClock, tab: 'audit' },
          { label: 'Profile', icon: User, tab: 'profile' },
        ];

  return (
    <View style={[styles.nav, Shadows.nav]}>
      {nav.map(({ label, icon: Icon, tab, center }) => {
        const isActive = active === tab;
        if (center) {
          return (
            <Pressable key={label} onPress={() => onSelect(tab)} style={styles.centerItem}>
              <View
                style={[
                  styles.centerTile,
                  Shadows.brand,
                  isActive ? styles.centerTileActive : null,
                ]}
              >
                <Icon size={24} color={Colors.primaryForeground} />
              </View>
              <Text style={[styles.centerLabel, isActive ? styles.centerLabelActive : null]}>
                {label}
              </Text>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={label}
            onPress={() => onSelect(tab)}
            style={[styles.navItem, isActive ? styles.navItemActive : null]}
          >
            <Icon size={20} color={isActive ? Colors.primary : Colors.mutedForeground} />
            <Text
              style={[
                styles.navLabel,
                { color: isActive ? Colors.primary : Colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217,227,235,0.7)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  navItem: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navItemActive: {
    backgroundColor: Colors.primarySoft,
  },
  navLabel: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    maxWidth: '100%',
  },
  centerItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: -28,
  },
  centerTile: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTileActive: {
    borderWidth: 3,
    borderColor: Colors.primarySoft,
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    color: Colors.foreground,
  },
  centerLabelActive: {
    color: Colors.primary,
  },
});
