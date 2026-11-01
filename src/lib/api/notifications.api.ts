import { apiRequest } from "./client";
import type { NotificationItem, NotificationListQuery, Page, SendNotificationBody } from "./types";

// /api/me/notifications: cần token, chỉ thao tác trên thông báo của chính mình. Luôn mới nhất trước.
export const notificationsApi = {
  list: (query: NotificationListQuery = {}) =>
    apiRequest<Page<NotificationItem>>("/api/me/notifications", { query }),
  unreadCount: () => apiRequest<{ count: number }>("/api/me/notifications/unread-count"),
  markRead: (id: string) =>
    apiRequest(`/api/me/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" }),
  markAllRead: () => apiRequest("/api/me/notifications/read-all", { method: "POST" }),
  /** /api/admin/notifications: cần NOTIFICATION_MANAGE. */
  send: (body: SendNotificationBody) =>
    apiRequest<{ recipients: number }>("/api/admin/notifications", { method: "POST", body }),
};
