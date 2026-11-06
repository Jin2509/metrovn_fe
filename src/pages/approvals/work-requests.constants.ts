import type { ProtectedPath } from "@/lib/auth";
import { approvalLabel } from "@/mocks/admin";
import type { WorkCategory, WorkPriority, WorkStatus } from "@/mocks/requests";

export const WORK_CATEGORY_LABELS: Record<WorkCategory, string> = {
  ...approvalLabel,
  OTHER: "Khác (lỗi, báo cáo…)",
};

/** Màn hình Admin dùng để thực hiện từng nhóm yêu cầu. "Khác" không gắn màn hình nào. */
export const WORK_CATEGORY_ROUTE: Partial<
  Record<WorkCategory, { to: ProtectedPath; tab?: string }>
> = {
  TICKET_TYPE: { to: "/tickets" },
  PARKING_LOT: { to: "/tickets", tab: "parking" },
  PARKING_PRICE: { to: "/tickets", tab: "parking" },
  GREEN_POLICY: { to: "/green-journey" },
  OPERATION: { to: "/trains" },
  TRAIN: { to: "/trains" },
  ACCOUNT: { to: "/users" },
  ASSIGNMENT: { to: "/users" },
  STATION: { to: "/stations" },
  LINE: { to: "/stations" },
  SCHOOL: { to: "/student-verifications" },
  SYSTEM_PARAM: { to: "/system-params" },
};

export const WORK_PRIORITY: Record<WorkPriority, { label: string; className: string }> = {
  LOW: { label: "Thấp", className: "bg-muted text-muted-foreground" },
  NORMAL: { label: "Bình thường", className: "bg-secondary text-secondary-foreground" },
  HIGH: { label: "Cao", className: "bg-accent/20 text-accent-foreground" },
  URGENT: { label: "Khẩn", className: "bg-destructive/15 text-destructive" },
};

/** Nhãn riêng cho luồng yêu cầu, màu lấy theo `StatusBadge`. */
export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  OPEN: "Mới",
  IN_PROGRESS: "Đang xử lý",
  NEEDS_INFO: "Cần bổ sung",
  RESOLVED: "Chờ xác nhận",
  DONE: "Hoàn thành",
  DECLINED: "Không thực hiện",
};

/** Mã màu tương ứng trong bảng màu của `StatusBadge`. */
export const WORK_STATUS_TONE: Record<WorkStatus, string> = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  NEEDS_INFO: "PENDING",
  RESOLVED: "SCHEDULED",
  DONE: "APPROVED",
  DECLINED: "REJECTED",
};

export const WORK_FILTER_OPTIONS = [
  { value: "WAITING_ME", label: "Đang chờ tôi" },
  { value: "ACTIVE", label: "Chưa kết thúc" },
  { value: "ALL", label: "Tất cả" },
  ...(Object.keys(WORK_STATUS_LABELS) as WorkStatus[]).map((value) => ({
    value,
    label: WORK_STATUS_LABELS[value],
  })),
] as const;

export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const ATTACHMENT_MAX_FILES = 5;
/** Danh sách cho phép: văn bản, bảng tính, ảnh. Backend phải kiểm tra lại cả loại file thật. */
export const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg";
