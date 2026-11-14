import { createStore } from "@/lib/store";

// Thông báo vận hành (bảng `announcement`, UC13-04). Dữ liệu thật: `announcementsApi`.
// Luồng: DRAFT → gửi duyệt → PENDING_APPROVAL → Manager duyệt (APPROVED) hoặc từ chối (REJECTED).
// Duyệt xong backend tự tạo chiến dịch gửi tới đúng đối tượng vào lúc `startsAt`.

export type AnnouncementSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AnnouncementScope = "ALL" | "LINE" | "STATION" | "ROLE";
export type AnnouncementStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type Announcement = {
  id: string;
  title: string;
  content: string;
  severity: AnnouncementSeverity;
  scope: AnnouncementScope;
  lineId?: string;
  stationId?: string;
  /** Mã vai trò khi `scope = ROLE`. */
  targetRole?: string;
  /** Instant ISO. */
  startsAt: string;
  endsAt?: string;
  status: AnnouncementStatus;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export const announcementsStore = createStore<Announcement[]>([]);
