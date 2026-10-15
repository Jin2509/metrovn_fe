import { useState } from "react";
import { toast } from "sonner";
import { noticesStore } from "@/mocks/admin";
import { NOTIFICATION_REQUIRED_FIELDS_ERROR } from "@/pages/notifications/notifications.constants";
import { sendNotification } from "@/pages/notifications/notifications.service";
import type { NotificationDraft } from "@/pages/notifications/notifications.types";

const EMPTY_DRAFT: NotificationDraft = { title: "", body: "", audience: "Tất cả" };

export function useNotifications() {
  const notices = noticesStore.use();
  const [draft, setDraft] = useState<NotificationDraft>(EMPTY_DRAFT);
  const [error, setError] = useState("");

  const send = () => {
    if (!sendNotification(draft)) return setError(NOTIFICATION_REQUIRED_FIELDS_ERROR);
    toast.success(`Đã gửi tới: ${draft.audience}`);
    setDraft(EMPTY_DRAFT);
    setError("");
  };

  return { notices, draft, error, setDraft, send };
}
