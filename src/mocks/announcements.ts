import { createStore } from "@/lib/store";
import { usersStore, type User } from "./admin";

// Thông báo vận hành (GIẢ LẬP) — bám theo bảng `announcement` (mục 3.3.2.14) và UC13-04.
// Kết quả gửi lấy từ bảng `notification`: mỗi người nhận một dòng với status PENDING/SENT/FAILED
// và is_read. Hệ thống không theo dõi lượt bấm hay tỉ lệ mở email nên không hiển thị các số đó.

export type AnnouncementSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AnnouncementAudience = "PASSENGER" | "STAFF" | "ACCOUNTANT" | "ALL";
export type AnnouncementChannel = "EMAIL" | "IN_APP" | "PUSH";

export type Delivery = {
  recipients: number;
  sent: number;
  failed: number;
  /** Số người đã mở trong ứng dụng (notification.is_read) — chỉ có với kênh trong ứng dụng. */
  read: number;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  severity: AnnouncementSeverity;
  lineId?: string;
  stationId?: string;
  audience: AnnouncementAudience;
  channels: AnnouncementChannel[];
  startsAt: string;
  endsAt?: string;
  status: "DRAFT" | "PUBLISHED";
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  delivery?: Delivery;
};

const pad = (n: number) => String(n).padStart(2, "0");
/** Định dạng `YYYY-MM-DD HH:mm` theo giờ máy. */
export const fmtDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Mốc thời gian tính theo lúc mở trang để bản demo luôn có thông báo đang hiệu lực / sắp tới / đã kết thúc.
const now = Date.now();

const ROLES: Record<AnnouncementAudience, User["role"][]> = {
  PASSENGER: ["PASSENGER"],
  STAFF: ["STAFF"],
  ACCOUNTANT: ["ACCOUNTANT"],
  ALL: ["PASSENGER", "STAFF", "ACCOUNTANT"],
};
/** Kết quả gửi mẫu: số người nhận đếm từ tài khoản đang hoạt động, giống lúc gửi thật. */
function delivery(audience: AnnouncementAudience, failed: number, readRatio: number): Delivery {
  const recipients = usersStore
    .get()
    .filter((u) => u.status === "ACTIVE" && ROLES[audience].includes(u.role)).length;
  return {
    recipients,
    sent: recipients - failed,
    failed,
    read: Math.round(recipients * readRatio),
  };
}
const at = (hours: number) => fmtDateTime(new Date(now + hours * 3600e3));

export const announcementsStore = createStore<Announcement[]>([
  {
    id: "TB-0006",
    title: "Tàu chạy chậm khoảng 8 phút qua ga Thủ Đức",
    content:
      "Do kiểm tra tín hiệu, tàu qua ga Thủ Đức chạy chậm khoảng 8 phút. Vui lòng dự trù thời gian di chuyển.",
    severity: "CRITICAL",
    lineId: "L1",
    stationId: "S1-11",
    audience: "PASSENGER",
    channels: ["IN_APP", "PUSH"],
    startsAt: at(-1),
    endsAt: at(2),
    status: "PUBLISHED",
    createdBy: "Nguyễn Văn An",
    createdAt: at(-1),
    sentAt: at(-1),
    delivery: delivery("PASSENGER", 0, 0.6),
  },
  {
    id: "TB-0005",
    title: "Bảo dưỡng thang cuốn ga Thảo Điền",
    content: "Thang cuốn lối B ga Thảo Điền tạm dừng để bảo dưỡng. Vui lòng sử dụng thang máy.",
    severity: "WARNING",
    lineId: "L1",
    stationId: "S1-6",
    audience: "PASSENGER",
    channels: ["IN_APP"],
    startsAt: at(-20),
    endsAt: at(30),
    status: "PUBLISHED",
    createdBy: "Nguyễn Văn An",
    createdAt: at(-20),
    sentAt: at(-20),
    delivery: delivery("PASSENGER", 0, 0.75),
  },
  {
    id: "TB-0004",
    title: "Lịch trực tăng cường dịp lễ",
    content: "Nhân viên các ga trực tăng cường từ 17:00 đến 23:00 ngày lễ theo phân công đính kèm.",
    severity: "INFO",
    audience: "STAFF",
    channels: ["EMAIL", "IN_APP"],
    startsAt: at(-30),
    endsAt: at(96),
    status: "PUBLISHED",
    createdBy: "Nguyễn Văn An",
    createdAt: at(-30),
    sentAt: at(-30),
    delivery: delivery("STAFF", 1, 0.7),
  },
  {
    id: "TB-0003",
    title: "Kéo dài giờ chạy tàu dịp lễ hội",
    content:
      "Chuyến cuối Tuyến 1 lùi đến 23:00 trong hai ngày lễ hội. Giãn cách giờ cao điểm 6 phút.",
    severity: "INFO",
    lineId: "L1",
    audience: "ALL",
    channels: ["EMAIL", "IN_APP", "PUSH"],
    startsAt: at(72),
    endsAt: at(120),
    status: "PUBLISHED",
    createdBy: "Nguyễn Văn An",
    createdAt: at(-4),
    sentAt: at(-4),
    delivery: delivery("ALL", 1, 0.4),
  },
  {
    id: "TB-0002",
    title: "Nhắc chốt sổ doanh thu tháng",
    content: "Kế toán hoàn tất đối soát giao dịch trước ngày 5 để chốt kỳ.",
    severity: "INFO",
    audience: "ACCOUNTANT",
    channels: ["EMAIL"],
    startsAt: at(-200),
    endsAt: at(-100),
    status: "PUBLISHED",
    createdBy: "Nguyễn Văn An",
    createdAt: at(-200),
    sentAt: at(-200),
    delivery: delivery("ACCOUNTANT", 0, 0),
  },
  {
    id: "TB-0001",
    title: "Tạm đóng lối B ga Ba Son",
    content: "Lối B ga Ba Son tạm đóng để sửa mái che. Vui lòng sử dụng lối A.",
    severity: "WARNING",
    lineId: "L1",
    stationId: "S1-3",
    audience: "PASSENGER",
    channels: ["IN_APP", "PUSH"],
    startsAt: at(-300),
    endsAt: at(-150),
    status: "PUBLISHED",
    createdBy: "Nguyễn Văn An",
    createdAt: at(-300),
    sentAt: at(-300),
    delivery: delivery("PASSENGER", 0, 0.85),
  },
  {
    id: "TB-0007",
    title: "Bảo trì hệ thống thanh toán đêm Chủ nhật",
    content:
      "Từ 00:00 đến 02:00, thanh toán trực tuyến tạm gián đoạn. Vé đã mua vẫn sử dụng bình thường.",
    severity: "WARNING",
    audience: "ALL",
    channels: ["EMAIL", "IN_APP"],
    startsAt: at(100),
    endsAt: at(102),
    status: "DRAFT",
    createdBy: "Nguyễn Văn An",
    createdAt: at(-2),
  },
]);
