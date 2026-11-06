import { getActorName } from "@/lib/auth/session.store";
import { createStore } from "@/lib/store";
import { activeWorkRequestStore, appendThreadMessage } from "./requests";
import { stations } from "./metro";

const names = [
  "Phạm Quốc Huy",
  "Đỗ Thu Hà",
  "Võ Thành Long",
  "Bùi Ngọc Mai",
  "Hoàng Gia Bảo",
  "Ngô Thanh Tâm",
  "Đặng Hữu Phúc",
  "Lý Mỹ Linh",
  "Trịnh Văn Nam",
  "Phan Khánh Vy",
  "Mai Anh Tuấn",
  "Tạ Kim Ngân",
];
export type User = {
  id: string;
  name: string;
  email: string;
  role: "STAFF" | "ACCOUNTANT" | "PASSENGER" | "MANAGER";
  status: "ACTIVE" | "LOCKED" | "INACTIVE";
  stationId: string | null;
  createdAt: string;
  lockReason?: string;
};
export const usersStore = createStore<User[]>(
  Array.from({ length: 36 }, (_, i) => ({
    id: `U${1000 + i}`,
    name: names[i % names.length] + (i >= 12 ? ` ${Math.floor(i / 12) + 1}` : ""),
    email: `user${i + 1}@metro.vn`,
    role: (["STAFF", "PASSENGER", "ACCOUNTANT", "STAFF", "PASSENGER", "MANAGER"] as const)[i % 6],
    status: i % 11 === 3 ? "LOCKED" : i % 13 === 5 ? "INACTIVE" : "ACTIVE",
    stationId: i % 6 === 0 || i % 6 === 3 ? stations[i % 14].id : null,
    createdAt: `2026-${String((i % 9) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
  })),
);

export type ApprovalType =
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
  | "SYSTEM_PARAM";
export const approvalLabel: Record<ApprovalType, string> = {
  TICKET_TYPE: "Loại vé",
  PARKING_LOT: "Bãi xe",
  PARKING_PRICE: "Giá gửi xe",
  GREEN_POLICY: "Hành trình xanh",
  OPERATION: "Cấu hình vận hành",
  TRAIN: "Đoàn tàu",
  ACCOUNT: "Tài khoản & nhân viên",
  ASSIGNMENT: "Phân công ga",
  STATION: "Nhà ga",
  LINE: "Tuyến đường",
  SCHOOL: "Danh sách trường",
  SYSTEM_PARAM: "Tham số hệ thống",
};
export type Approval = {
  id: string;
  type: ApprovalType;
  title: string;
  by: string;
  at: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  changes: { field: string; old: string; new: string }[];
  reason?: string;
  decidedBy?: string;
  /**
   * Dữ liệu cần để áp dụng thay đổi khi Manager phê duyệt (xem `approvals.service.ts`).
   * Admin chỉ được đề xuất; dữ liệu thật (ga/tuyến) chỉ được ghi vào kho dữ liệu sau khi duyệt.
   */
  payload?: unknown;
  /** Yêu cầu của Manager mà đề xuất này thực hiện (xem `mocks/requests.ts`). */
  workRequestId?: string;
};
// Mới nhất đứng đầu, giống thứ tự khi `submitApproval` thêm yêu cầu.
export const approvalsStore = createStore<Approval[]>([
  {
    id: "A5",
    type: "ACCOUNT",
    title: "Tạo tài khoản kế toán: Lê Hoàng Yến",
    by: "Nguyễn Văn An",
    at: "2026-10-14 10:10",
    status: "PENDING",
    changes: [
      { field: "Vai trò", old: "—", new: "ACCOUNTANT" },
      { field: "Email", old: "—", new: "yen.le@metro.vn" },
    ],
  },
  {
    id: "A4",
    type: "OPERATION",
    title: "Giờ vận hành cuối tuần",
    by: "Nguyễn Văn An",
    at: "2026-10-09 16:40",
    status: "REJECTED",
    decidedBy: "Trần Thị Bình",
    reason: "Chưa đủ nhân sự ca đêm",
    changes: [{ field: "Giờ đóng cửa T7/CN", old: "22:00", new: "23:30" }],
  },
  {
    id: "A3",
    type: "PARKING_PRICE",
    title: "Giá gửi ô tô theo giờ tại Suối Tiên",
    by: "Nguyễn Văn An",
    at: "2026-10-10 08:00",
    status: "APPROVED",
    decidedBy: "Trần Thị Bình",
    changes: [{ field: "Ô tô / giờ", old: "20.000 VND", new: "25.000 VND" }],
    workRequestId: "W1",
  },
  {
    id: "A2",
    type: "TICKET_TYPE",
    title: "Thêm loại vé: Vé tuần",
    by: "Nguyễn Văn An",
    at: "2026-10-13 14:05",
    status: "PENDING",
    changes: [
      { field: "Mã loại vé", old: "—", new: "WEEK" },
      { field: "Tên loại vé", old: "—", new: "Vé tuần" },
      { field: "Giá vé", old: "—", new: "150.000 VND" },
    ],
    payload: {
      catalog: "ticketType",
      action: "CREATE",
      draft: {
        code: "WEEK",
        name: "Vé tuần",
        validityHours: 168,
        price: 150000,
        status: "ACTIVE",
      },
    },
  },
  {
    id: "A1",
    type: "PARKING_PRICE",
    title: "Sửa giá gửi xe: Xe máy / Lượt",
    by: "Nguyễn Văn An",
    at: "2026-10-12 09:20",
    status: "PENDING",
    changes: [{ field: "Giá", old: "5.000 VND", new: "6.000 VND" }],
    payload: {
      catalog: "parkingPrice",
      action: "UPDATE",
      id: "PP2",
      draft: { vehicle: "Xe máy", unit: "Lượt", price: 6000 },
    },
  },
]);
/** Tạo yêu cầu phê duyệt cho Manager; trả về mã yêu cầu để màn hình gửi duyệt theo dõi kết quả. */
let approvalSeq = 0;
export function submitApproval(
  type: ApprovalType,
  title: string,
  changes: Approval["changes"],
  payload?: unknown,
): string {
  // Thêm số đếm vì hai yêu cầu có thể tạo trong cùng một mili giây.
  const id = `A${Date.now()}-${++approvalSeq}`;
  // Admin đang làm một yêu cầu của Manager thì đề xuất tự gắn vào yêu cầu đó.
  const workRequestId = activeWorkRequestStore.get() ?? undefined;
  approvalsStore.set((a) => [
    {
      id,
      type,
      title,
      by: getActorName(),
      at: new Date().toLocaleString("vi-VN"),
      status: "PENDING",
      changes,
      payload,
      workRequestId,
    },
    ...a,
  ]);
  if (workRequestId)
    appendThreadMessage(
      workRequestId,
      `${getActorName()} đã gửi đề xuất “${title}” để Manager duyệt.`,
      {
        system: true,
      },
    );
  logAction("Gửi duyệt", title);
  return id;
}

/** Có yêu cầu STATION/LINE nào đang chờ Manager duyệt cho đúng đối tượng này không (chặn gửi trùng). */
export function hasPendingApproval(type: ApprovalType, matchTarget: (payload: unknown) => boolean) {
  return approvalsStore
    .get()
    .some((a) => a.type === type && a.status === "PENDING" && matchTarget(a.payload));
}

export type Audit = { id: string; at: string; actor: string; action: string; target: string };
const actions = [
  "Đăng nhập",
  "Tạo tài khoản",
  "Khóa tài khoản",
  "Sửa giá vé",
  "Gửi thông báo",
  "Đối soát",
  "Phê duyệt",
];
export const auditStore = createStore<Audit[]>(
  Array.from({ length: 40 }, (_, i) => ({
    id: `L${i}`,
    at: `2026-10-${String(14 - (i % 13)).padStart(2, "0")} ${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    actor: ["Nguyễn Văn An", "Trần Thị Bình", "Lê Minh Châu"][i % 3],
    action: actions[i % actions.length],
    target: `#${2000 + i}`,
  })),
);
export function logAction(action: string, target: string) {
  auditStore.set((a) => [
    {
      id: `L${Date.now()}`,
      at: new Date().toLocaleString("vi-VN"),
      actor: getActorName(),
      action,
      target,
    },
    ...a,
  ]);
}

export type TicketTypeRow = {
  id: string;
  code: string;
  name: string;
  validityHours: number;
  price: number;
  status: "ACTIVE" | "INACTIVE";
};
export const ticketTypesStore = createStore<TicketTypeRow[]>([
  {
    id: "TT2",
    code: "DAY",
    name: "Vé ngày",
    validityHours: 24,
    price: 40000,
    status: "ACTIVE",
  },
  {
    id: "TT3",
    code: "THREE_DAY",
    name: "Vé 3 ngày",
    validityHours: 72,
    price: 90000,
    status: "ACTIVE",
  },
  {
    id: "TT4",
    code: "MONTH",
    name: "Vé tháng",
    validityHours: 720,
    price: 300000,
    status: "ACTIVE",
  },
  {
    id: "TT5",
    code: "MONTH_STUDENT",
    name: "Vé tháng HSSV",
    validityHours: 720,
    price: 150000,
    status: "ACTIVE",
  },
]);
/** Thời hạn dễ đọc từ số giờ: quá 3 ngày và tròn ngày thì đổi ra ngày. */
export function formatValidity(ticket: Pick<TicketTypeRow, "validityHours">) {
  const hours = ticket.validityHours;
  return hours > 72 && hours % 24 === 0 ? `${hours / 24} ngày` : `${hours} giờ`;
}
export type ParkingLotRow = {
  id: string;
  code: string;
  name: string;
  stationId: string;
  bike: number;
  moto: number;
  car: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  /** Tỉ lệ lấp đầy, hệ thống tự tính từ lượt gửi xe. */
  used: number;
};
export const parkingLotsStore = createStore<ParkingLotRow[]>([
  {
    id: "PK1",
    code: "PK-ST",
    name: "Bãi Suối Tiên",
    stationId: "S1-14",
    moto: 1200,
    car: 150,
    bike: 200,
    status: "ACTIVE",
    used: 0.72,
  },
  {
    id: "PK2",
    code: "PK-TD",
    name: "Bãi Thủ Đức",
    stationId: "S1-11",
    moto: 800,
    car: 60,
    bike: 120,
    status: "ACTIVE",
    used: 0.88,
  },
  {
    id: "PK3",
    code: "PK-RC",
    name: "Bãi Rạch Chiếc",
    stationId: "S1-8",
    moto: 600,
    car: 80,
    bike: 80,
    status: "ACTIVE",
    used: 0.41,
  },
  {
    id: "PK4",
    code: "PK-AP",
    name: "Bãi An Phú",
    stationId: "S1-7",
    moto: 500,
    car: 40,
    bike: 60,
    status: "ACTIVE",
    used: 0.65,
  },
]);
export const parkingPricesStore = createStore([
  { id: "PP1", vehicle: "Xe đạp", unit: "Lượt", price: 2000 },
  { id: "PP2", vehicle: "Xe máy", unit: "Lượt", price: 5000 },
  { id: "PP3", vehicle: "Xe máy", unit: "Tháng", price: 120000 },
  { id: "PP4", vehicle: "Ô tô", unit: "Giờ", price: 20000 },
  { id: "PP5", vehicle: "Ô tô", unit: "Ngày", price: 120000 },
]);

export type Txn = {
  id: string;
  at: string;
  orderId: string;
  amount: number;
  refund: number;
  method: string;
  gateway: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  service: "Vé" | "Gửi xe";
  reconciled: boolean;
  reconciledBy?: string;
};
export const txnStore = createStore<Txn[]>(
  Array.from({ length: 80 }, (_, i) => {
    const st = (
      [
        "SUCCESS",
        "SUCCESS",
        "SUCCESS",
        "SUCCESS",
        "FAILED",
        "SUCCESS",
        "REFUNDED",
        "PENDING",
      ] as const
    )[i % 8];
    const amount = [40000, 90000, 300000, 150000, 40000, 5000, 20000][i % 7];
    return {
      id: `GD${50000 + i}`,
      at: `2026-10-${String(14 - (i % 14)).padStart(2, "0")} ${String(6 + (i % 15)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
      orderId: `DH${80000 + i}`,
      amount,
      refund: st === "REFUNDED" ? amount : 0,
      method: ["Ví điện tử", "Thẻ ngân hàng", "QR"][i % 3],
      gateway: ["MoMo", "VNPay", "ZaloPay"][i % 3],
      status: st,
      service: i % 7 === 5 || i % 7 === 6 ? "Gửi xe" : "Vé",
      reconciled: st === "SUCCESS" && i > 30,
    };
  }),
);
export const periodsStore = createStore([
  {
    month: "07/2026",
    revenue: 14_820_000_000,
    refund: 92_000_000,
    promo: 410_000_000,
    closed: true,
  },
  {
    month: "08/2026",
    revenue: 15_430_000_000,
    refund: 88_000_000,
    promo: 520_000_000,
    closed: true,
  },
  {
    month: "09/2026",
    revenue: 15_910_000_000,
    refund: 101_000_000,
    promo: 480_000_000,
    closed: false,
  },
]);
