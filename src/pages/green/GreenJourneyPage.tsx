import { Crown, Leaf, Trophy } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { LeaderboardPanel } from "@/pages/green/components/LeaderboardPanel";
import { SettingsPanel } from "@/pages/green/components/SettingsPanel";
import { TierPanel } from "@/pages/green/components/TierPanel";

export function GreenJourneyPage() {
  const { hasPermission } = useAuth();
  return (
    <AppShell title="Hành trình xanh">
      <PageTabs
        tabs={[
          {
            value: "settings",
            label: "Cách tính điểm xanh",
            icon: Leaf,
            content: <SettingsPanel canEdit={hasPermission("GREEN_JOURNEY_MANAGE")} />,
          },
          {
            value: "leaderboard",
            label: "Bảng xếp hạng",
            icon: Trophy,
            content: <LeaderboardPanel />,
          },
          {
            value: "tiers",
            label: "Hạng thành viên",
            icon: Crown,
            content: <TierPanel canEdit={hasPermission("SYSTEM_PARAM_MANAGE")} />,
            // Xem hạng thành viên cũng cần SYSTEM_PARAM_MANAGE.
            hidden: !hasPermission("SYSTEM_PARAM_MANAGE"),
          },
        ]}
      />
    </AppShell>
  );
}
