import type {
  AnnouncementAudience,
  AnnouncementChannel,
  AnnouncementSeverity,
} from "@/mocks/announcements";

export const SEVERITY_LABELS: Record<AnnouncementSeverity, string> = {
  INFO: "Thông tin",
  WARNING: "Cảnh báo",
  CRITICAL: "Khẩn cấp",
};

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  PASSENGER: "Hành khách",
  STAFF: "Nhân viên nhà ga",
  ACCOUNTANT: "Kế toán",
  ALL: "Tất cả",
};

export const CHANNEL_LABELS: Record<AnnouncementChannel, { label: string; hint: string }> = {
  EMAIL: { label: "Email", hint: "Gửi tới email của tài khoản" },
  IN_APP: { label: "Trong ứng dụng", hint: "Lưu vào mục Thông báo, có trạng thái đã đọc" },
  PUSH: { label: "Thông báo đẩy", hint: "Gửi tới thiết bị đã đăng ký (device token)" },
};

/** Kế toán chỉ dùng web quản trị nên chỉ nhận email; hành khách và nhân viên ga có ứng dụng di động. */
export const CHANNELS_BY_AUDIENCE: Record<AnnouncementAudience, AnnouncementChannel[]> = {
  PASSENGER: ["EMAIL", "IN_APP", "PUSH"],
  STAFF: ["EMAIL", "IN_APP", "PUSH"],
  ACCOUNTANT: ["EMAIL"],
  ALL: ["EMAIL", "IN_APP", "PUSH"],
};

export type AnnouncementPhase = "DRAFT" | "SCHEDULED" | "ACTIVE" | "ENDED";
export const PHASE_LABELS: Record<AnnouncementPhase, { label: string; badge: string }> = {
  DRAFT: { label: "Nháp", badge: "DRAFT" },
  SCHEDULED: { label: "Sắp hiệu lực", badge: "SCHEDULED" },
  ACTIVE: { label: "Đang hiệu lực", badge: "ACTIVE" },
  ENDED: { label: "Đã kết thúc", badge: "EXPIRED" },
};
