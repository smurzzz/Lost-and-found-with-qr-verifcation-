import { router } from 'expo-router';

import { ProfileView } from '@/components/profile-view';
import { StaffNav, type StaffTab } from '@/components/ui/staff-nav';

/** Staff demo identity (Phase 3 replaces with the real Clerk session). */
const profile = {
  name: 'Maya Chen',
  initials: 'MC',
  email: 'maya.chen@school.edu',
};

/**
 * Staff Profile (09-FUNCTIONALITY-PROMPT.md §13) — Phase 1 static build.
 * Shares the ProfileView layout with the student variant; sign-out is a mock
 * navigation to Login until real auth lands in Phase 3.
 */
export default function StaffProfileScreen() {
  const handleNavSelect = (tab: StaffTab) => {
    if (tab === 'profile') return;
    router.push(tab === 'home' ? '/(staff)/dashboard' : `/(staff)/${tab}`);
  };

  return (
    <ProfileView
      name={profile.name}
      initials={profile.initials}
      role="Staff"
      email={profile.email}
      rows={[
        { glyph: '♧', label: 'Notification Settings' },
        { glyph: '?', label: 'Help & Support' },
      ]}
      onLogout={() => router.replace('/login')}
      onBack={() => router.back()}
      nav={<StaffNav active="profile" onSelect={handleNavSelect} />}
    />
  );
}
