import { useNavigate } from "@tanstack/react-router";
import { History as HistoryIcon, PenSquare } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { Composer } from "@/pages/notifications/components/Composer";
import { History } from "@/pages/notifications/components/History";

export function NotificationsPage() {
  const navigate = useNavigate();
  const go = (tab?: string) => navigate({ to: "/notifications", search: { tab } });
  return (
    <AppShell title="Thông báo vận hành">
      <PageTabs
        tabs={[
          {
            value: "compose",
            label: "Soạn thông báo",
            icon: PenSquare,
            content: <Composer onDone={() => go("history")} />,
          },
          {
            value: "history",
            label: "Lịch sử",
            icon: HistoryIcon,
            content: <History onEditDraft={() => go()} />,
          },
        ]}
      />
    </AppShell>
  );
}
