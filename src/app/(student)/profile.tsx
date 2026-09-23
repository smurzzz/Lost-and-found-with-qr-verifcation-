import { router } from 'expo-router';

import { ProfileView } from '@/components/profile-view';
import { BottomNav, type NavTab } from '@/components/ui/bottom-nav';

/** Student demo identity (Phase 3 replaces with the real Clerk session). */
const profile = {
  name: 'Alex Morgan',
  initials: 'AM',
  email: 'alex.morgan@school.edu',
};

/**
 * Student Profile (09-FUNCTIONALITY-PROMPT.md §13) — Phase 1 static build.
 * Shares the ProfileView layout with the staff variant; sign-out is a mock
 * navigation to Login until real auth lands in Phase 3.
 */
export default function StudentProfileScreen() {
  const handleNavSelect = (tab: NavTab) => {
    if (tab === 'profile') return;
    router.push('/(student)/home');
  };

  return (
    <ProfileView
      name={profile.name}
      initials={profile.initials}
      role="Student"
      email={profile.email}
      rows={[
        { glyph: '♧', label: 'Notification Settings' },
        { glyph: '?', label: 'Help & Support' },
      ]}
      onLogout={() => router.replace('/login')}
      onBack={() => router.back()}
      nav={<BottomNav active="profile" onSelect={handleNavSelect} />}
    />
  );
}
