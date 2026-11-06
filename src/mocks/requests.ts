import { format } from "date-fns";
import type { Role } from "@/lib/auth/auth.types";
import { authStore, getActorName } from "@/lib/auth/session.store";
import { createStore } from "@/lib/store";
import type { ApprovalType } from "./admin";

/**
 * Yêu cầu chiều Manager → Admin ("việc cần làm"), bổ sung cho Approval (Admin → Manager).
 * Hai loại dùng chung luồng trao đổi (`threadsStore`, theo mã yêu cầu) và file đính kèm.
 * Luồng chi tiết: xem `managerflow.md` ở gốc dự án.
 */
export type WorkCategory = ApprovalType | "OTHER";
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
  /** Object URL trong phiên hiện tại. Dữ liệu mẫu không có file thật nên để trống. */
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

const xlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Mới nhất đứng đầu. W1 đã hoàn tất qua đề xuất A3 (xem `workRequestId` trong approvalsStore).
export const workRequestsStore = createStore<WorkRequest[]>([
  {
    id: "W4",
    category: "PARKING_PRICE",
    title: "Cập nhật giá gửi xe máy theo bảng giá mới",
    description:
      "Ban giám đốc đã chốt bảng giá gửi xe mới áp dụng từ 01/11. Nhờ Admin cập nhật giá xe máy theo lượt và theo tháng như file đính kèm.",
    priority: "HIGH",
    dueDate: "2026-11-10",
    by: "Trần Thị Bình",
    at: "2026-11-04 09:00",
    status: "OPEN",
    attachments: [{ id: "F4", name: "bang-gia-gui-xe-2026.xlsx", size: 48_213, type: xlsx }],
  },
  {
    id: "W3",
    category: "SCHOOL",
    title: "Thêm ĐH Công nghệ Thông tin vào danh sách tự duyệt",
    description: "Trường vừa ký hợp tác ưu đãi vé sinh viên, cần thêm vào danh sách tự xác nhận.",
    priority: "NORMAL",
    dueDate: "2026-11-15",
    by: "Trần Thị Bình",
    at: "2026-11-02 14:20",
    status: "NEEDS_INFO",
    handledBy: "Nguyễn Văn An",
    attachments: [],
  },
  {
    id: "W2",
    category: "OTHER",
    title: "Ga Bến Thành hiển thị sai giờ mở cửa trên app",
    description:
      "Hành khách phản ánh app hiện 05:30, thực tế ga mở 05:00. Ảnh chụp màn hình kèm theo.",
    priority: "URGENT",
    by: "Trần Thị Bình",
    at: "2026-10-30 07:45",
    status: "RESOLVED",
    handledBy: "Nguyễn Văn An",
    resolution: "Đã sửa nội dung hiển thị giờ mở cửa, app cập nhật sau khi khởi động lại.",
    attachments: [{ id: "F2", name: "app-ben-thanh.png", size: 312_400, type: "image/png" }],
  },
  {
    id: "W1",
    category: "PARKING_PRICE",
    title: "Tăng giá gửi ô tô tại Suối Tiên",
    description:
      "Bãi Suối Tiên thường xuyên quá tải, đề nghị tăng giá ô tô theo giờ lên 25.000 VND.",
    priority: "NORMAL",
    by: "Trần Thị Bình",
    at: "2026-10-08 10:00",
    status: "DONE",
    handledBy: "Nguyễn Văn An",
    resolution: "Hoàn tất qua đề xuất “Giá gửi ô tô theo giờ tại Suối Tiên”.",
    attachments: [],
  },
]);

const message = (
  id: string,
  at: string,
  author: string,
  role: ThreadMessage["role"],
  text: string,
  attachments: Attachment[] = [],
): ThreadMessage => ({ id, at, author, role, text, attachments });

/** Luồng trao đổi theo mã yêu cầu (A… cho đề xuất của Admin, W… cho yêu cầu của Manager). */
export const threadsStore = createStore<Record<string, ThreadMessage[]>>({
  W3: [
    message("M31", "2026-11-02 15:00", "Hệ thống", "SYSTEM", "Nguyễn Văn An đã nhận xử lý."),
    message(
      "M32",
      "2026-11-02 15:05",
      "Nguyễn Văn An",
      "ADMIN",
      "Chị gửi giúp em mã trường và tên miền email sinh viên (vd. @gm.uit.edu.vn) để cấu hình tự duyệt nhé.",
    ),
    message("M33", "2026-11-02 15:05", "Hệ thống", "SYSTEM", "Chuyển sang chờ Manager bổ sung."),
  ],
  W2: [
    message("M21", "2026-10-30 08:00", "Hệ thống", "SYSTEM", "Nguyễn Văn An đã nhận xử lý."),
    message(
      "M22",
      "2026-10-30 10:30",
      "Nguyễn Văn An",
      "ADMIN",
      "Đã sửa nội dung hiển thị giờ mở cửa, app cập nhật sau khi khởi động lại.",
    ),
    message(
      "M23",
      "2026-10-30 10:30",
      "Hệ thống",
      "SYSTEM",
      "Báo hoàn thành, chờ Manager xác nhận.",
    ),
  ],
  W1: [
    message("M11", "2026-10-08 11:00", "Hệ thống", "SYSTEM", "Nguyễn Văn An đã nhận xử lý."),
    message(
      "M12",
      "2026-10-10 08:00",
      "Hệ thống",
      "SYSTEM",
      "Nguyễn Văn An đã gửi đề xuất “Giá gửi ô tô theo giờ tại Suối Tiên” để Manager duyệt.",
    ),
    message(
      "M13",
      "2026-10-10 09:30",
      "Hệ thống",
      "SYSTEM",
      "Đề xuất “Giá gửi ô tô theo giờ tại Suối Tiên” đã được duyệt. Yêu cầu hoàn tất.",
    ),
  ],
});

/**
 * Yêu cầu Admin đang làm trên các màn hình cấu hình. Khi khác null, `submitApproval` tự gắn đề xuất
 * mới vào yêu cầu này, nhờ vậy không phải sửa từng màn hình gửi duyệt.
 */
export const activeWorkRequestStore = createStore<string | null>(null);

let seq = 0;
/** Thêm số đếm vì hai bản ghi có thể tạo trong cùng một mili giây. */
export const nextId = (prefix: string) => `${prefix}${Date.now()}-${++seq}`;
/** Cùng định dạng với dữ liệu mẫu để sắp xếp và đọc thống nhất. */
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
