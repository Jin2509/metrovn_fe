import { format } from "date-fns";
import type { Role } from "@/lib/auth/auth.types";
import { authStore, getActorName } from "@/lib/auth/session.store";
import { createStore } from "@/lib/store";

/**
 * Yêu cầu chiều Manager → Admin ("việc cần làm"), bổ sung cho Approval (Admin → Manager).
 * Hai loại dùng chung luồng trao đổi (`threadsStore`, theo mã yêu cầu) và file đính kèm.
 * Luồng chi tiết: xem `managerflow.md` ở gốc dự án. Backend chưa có API cho yêu cầu công việc.
 */
/** Nhóm việc Manager giao, theo màn hình Admin dùng để làm. */
export type WorkCategory =
  | "TICKET_TYPE"
  | "PARKING_LOT"
  | "PARKING_PRICE"
  | "GREEN_POLICY"
  | "OPERATION"
  | "TRAIN"
  | "ACCOUNT"
  | "ASSIGNMENT"
  | "STATION"
  | "LINE"
  | "SCHOOL"
  | "SYSTEM_PARAM"
  | "ANNOUNCEMENT"
  | "OTHER";
export type WorkPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type WorkStatus =
  | "OPEN" // Manager vừa gửi, chưa Admin nào nhận
  | "IN_PROGRESS" // Admin đang làm (có thể đang chờ đề xuất gắn kèm được duyệt)
  | "NEEDS_INFO" // Admin cần Manager bổ sung thông tin
  | "RESOLVED" // Admin báo xong, chờ Manager xác nhận
  | "DONE"
  | "DECLINED";

export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Object URL trong phiên hiện tại. */
  url?: string;
};

export type ThreadMessage = {
  id: string;
  at: string;
  author: string;
  role: Role | "SYSTEM";
  text: string;
  attachments: Attachment[];
};

export type WorkRequest = {
  id: string;
  category: WorkCategory;
  title: string;
  description: string;
  priority: WorkPriority;
  /** yyyy-mm-dd */
  dueDate?: string;
  by: string;
  at: string;
  status: WorkStatus;
  handledBy?: string;
  /** Ghi chú khi hoàn thành hoặc lý do không thực hiện. */
  resolution?: string;
  attachments: Attachment[];
};

// Mới nhất đứng đầu.
export const workRequestsStore = createStore<WorkRequest[]>([]);

/** Luồng trao đổi theo mã yêu cầu (A… cho đề xuất của Admin, W… cho yêu cầu của Manager). */
export const threadsStore = createStore<Record<string, ThreadMessage[]>>({});

/**
 * Yêu cầu Admin đang làm trên các màn hình cấu hình. Khi khác null, `submitApproval` tự gắn đề xuất
 * mới vào yêu cầu này, nhờ vậy không phải sửa từng màn hình gửi duyệt.
 */
export const activeWorkRequestStore = createStore<string | null>(null);

/**
 * Mục chờ duyệt trên backend (mã `Approval.id`) → yêu cầu công việc mà Admin đang làm lúc gửi duyệt.
 * Backend không lưu liên kết này nên chỉ giữ trong phiên hiện tại, giống yêu cầu công việc.
 */
export const approvalLinksStore = createStore<Record<string, string>>({});

let seq = 0;
/** Thêm số đếm vì hai bản ghi có thể tạo trong cùng một mili giây. */
export const nextId = (prefix: string) => `${prefix}${Date.now()}-${++seq}`;
/** Định dạng thống nhất để sắp xếp và đọc. */
export const nowLabel = () => format(new Date(), "yyyy-MM-dd HH:mm");

/** Ghi một dòng vào luồng trao đổi. Không truyền `author`/`role` thì lấy người đang đăng nhập. */
export function appendThreadMessage(
  requestId: string,
  text: string,
  options: { attachments?: Attachment[]; system?: boolean } = {},
) {
  const entry: ThreadMessage = {
    id: nextId("M"),
    at: nowLabel(),
    author: options.system ? "Hệ thống" : getActorName(),
    role: options.system ? "SYSTEM" : (authStore.get().user?.role ?? "SYSTEM"),
    text,
    attachments: options.attachments ?? [],
  };
  threadsStore.set((threads) => ({
    ...threads,
    [requestId]: [...(threads[requestId] ?? []), entry],
  }));
}
