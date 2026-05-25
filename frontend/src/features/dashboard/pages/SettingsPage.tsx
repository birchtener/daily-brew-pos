import { useStore } from '@/store/useStore';
import SettingsHeader from '../components/settings/SettingsHeader';
import AvatarSection from '../components/settings/AvatarSection';
import ProfileSection from '../components/settings/ProfileSection';
import PasswordSection from '../components/settings/PasswordSection';

export default function SettingsPage() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <SettingsHeader />
      <AvatarSection user={user} setUser={setUser} />
      <ProfileSection user={user} setUser={setUser} />
      <PasswordSection user={user} setUser={setUser} />
    </div>
  );
}
