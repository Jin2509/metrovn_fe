export type NotificationAudience = "Tất cả" | "Hành khách" | "Nhân viên" | "Kế toán";

export type NotificationDraft = {
  title: string;
  body: string;
  audience: NotificationAudience;
};
