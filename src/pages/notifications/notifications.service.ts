import { logAction, noticesStore } from "@/mocks/admin";
import type { NotificationDraft } from "@/pages/notifications/notifications.types";

export function sendNotification(draft: NotificationDraft) {
  if (!draft.title.trim() || !draft.body.trim()) return false;

  noticesStore.set((notices) => [
    { id: `N${Date.now()}`, ...draft, at: new Date().toLocaleString("vi-VN") },
    ...notices,
  ]);
  logAction("Gửi thông báo", draft.title);
  return true;
}
