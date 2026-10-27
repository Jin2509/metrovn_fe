import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { AccountSection } from "@/pages/profile/components/AccountSection";
import { PasswordSection } from "@/pages/profile/components/PasswordSection";
import { AppearanceSection } from "@/pages/profile/components/PreferencesSection";
import { ProfileFormSection } from "@/pages/profile/components/ProfileFormSection";

/** Cài đặt tài khoản cá nhân — mọi vai trò đều dùng, nội dung thông báo thay đổi theo vai trò. */
export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppShell title="Cài đặt tài khoản" description="Hồ sơ, mật khẩu và giao diện của riêng bạn">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <AccountSection user={user} />
          <ProfileFormSection />
        </div>
        <div className="space-y-6">
          <PasswordSection />
          <AppearanceSection />
        </div>
      </div>
    </AppShell>
  );
}
