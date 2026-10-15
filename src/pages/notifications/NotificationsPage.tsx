import { AppShell } from "@/components/app-shell";
import { NotificationComposer } from "@/pages/notifications/components/NotificationComposer";
import { NotificationHistory } from "@/pages/notifications/components/NotificationHistory";
import { useNotifications } from "@/pages/notifications/hooks/useNotifications";

export function NotificationsPage() {
  const { notices, draft, error, setDraft, send } = useNotifications();

  return (
    <AppShell title="Thông báo vận hành" roles={["ADMIN"]}>
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <NotificationComposer draft={draft} error={error} onDraftChange={setDraft} onSend={send} />
        <NotificationHistory notices={notices} />
      </div>
    </AppShell>
  );
}
