import type { AnnouncementScope, AnnouncementSeverity } from "@/stores/announcements";

export const SEVERITY_LABELS: Record<AnnouncementSeverity, string> = {
  INFO: "Thông tin",
  WARNING: "Cảnh báo",
  CRITICAL: "Khẩn cấp",
};

export const SCOPE_LABELS: Record<AnnouncementScope, string> = {
  ALL: "Toàn hệ thống",
  LINE: "Theo tuyến",
  STATION: "Theo ga",
  ROLE: "Theo vai trò",
};

/** Vai trò nhận được thông báo khi chọn phạm vi "Theo vai trò". */
export const TARGET_ROLES: [string, string][] = [
  ["PASSENGER", "Hành khách"],
  ["STAFF", "Nhân viên ga"],
  ["ACCOUNTANT", "Kế toán"],
  ["MANAGER", "Manager"],
];

export type AnnouncementPhase = "DRAFT" | "PENDING" | "REJECTED" | "SCHEDULED" | "ACTIVE" | "ENDED";
export const PHASE_LABELS: Record<AnnouncementPhase, { label: string; badge: string }> = {
  DRAFT: { label: "Nháp", badge: "DRAFT" },
  PENDING: { label: "Chờ duyệt", badge: "PENDING" },
  REJECTED: { label: "Bị từ chối", badge: "REJECTED" },
  SCHEDULED: { label: "Sắp hiệu lực", badge: "SCHEDULED" },
  ACTIVE: { label: "Đang hiệu lực", badge: "ACTIVE" },
  ENDED: { label: "Đã kết thúc", badge: "EXPIRED" },
};
