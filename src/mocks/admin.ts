import { getActorName } from "@/lib/auth/session.store";
import { createStore } from "@/lib/store";
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

export type ApprovalType = "TICKET_PRICE" | "PARKING_PRICE" | "PROMOTION" | "OPERATION" | "ACCOUNT";
export const approvalLabel: Record<ApprovalType, string> = {
  TICKET_PRICE: "Giá vé",
  PARKING_PRICE: "Giá gửi xe",
  PROMOTION: "Khuyến mãi",
  OPERATION: "Cấu hình vận hành",
  ACCOUNT: "Tài khoản & nhân viên",
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
};
export const approvalsStore = createStore<Approval[]>([
  {
    id: "A1",
    type: "TICKET_PRICE",
    title: "Tăng giá vé lượt chặng 6–10 km",
    by: "Nguyễn Văn An",
    at: "2026-10-12 09:20",
    status: "PENDING",
    changes: [
      { field: "Giá vé (6–10 km)", old: "12.000 ₫", new: "13.000 ₫" },
      { field: "Hiệu lực từ", old: "—", new: "01/11/2026" },
    ],
  },
  {
    id: "A2",
    type: "PROMOTION",
    title: "Khuyến mãi Sinh viên tháng 11",
    by: "Nguyễn Văn An",
    at: "2026-10-13 14:05",
    status: "PENDING",
    changes: [
      { field: "Giảm", old: "—", new: "20%" },
      { field: "Thời gian", old: "—", new: "01/11 – 30/11/2026" },
    ],
  },
  {
    id: "A3",
    type: "PARKING_PRICE",
    title: "Giá gửi ô tô theo giờ tại Suối Tiên",
    by: "Nguyễn Văn An",
    at: "2026-10-10 08:00",
    status: "APPROVED",
    decidedBy: "Trần Thị Bình",
    changes: [{ field: "Ô tô / giờ", old: "20.000 ₫", new: "25.000 ₫" }],
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
]);
export function submitApproval(type: ApprovalType, title: string, changes: Approval["changes"]) {
  approvalsStore.set((a) => [
    {
      id: `A${Date.now()}`,
      type,
      title,
      by: getActorName(),
      at: new Date().toLocaleString("vi-VN"),
      status: "PENDING",
      changes,
    },
    ...a,
  ]);
  logAction("Gửi duyệt", title);
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

export const trains = Array.from({ length: 8 }, (_, i) => ({
  id: `T${101 + i}`,
  code: `HM-${101 + i}`,
  cars: 3,
  capacity: 930,
  status: i === 5 ? "MAINTENANCE" : "ACTIVE",
  line: "Tuyến 1",
}));
export const operationConfigsStore = createStore([
  {
    id: "C3",
    version: "v3",
    headway: "6 phút (cao điểm) / 10 phút",
    hours: "05:00 – 22:00",
    status: "ACTIVE",
    approvedBy: "Trần Thị Bình",
  },
  {
    id: "C4",
    version: "v4",
    headway: "5 phút (cao điểm) / 10 phút",
    hours: "05:00 – 22:30",
    status: "DRAFT",
    approvedBy: "",
  },
]);

export const ticketTypesStore = createStore([
  { id: "TT1", name: "Vé lượt", validity: "Trong ngày", price: 0, status: "ACTIVE" },
  { id: "TT2", name: "Vé ngày", validity: "24 giờ", price: 40000, status: "ACTIVE" },
  { id: "TT3", name: "Vé 3 ngày", validity: "72 giờ", price: 90000, status: "ACTIVE" },
  { id: "TT4", name: "Vé tháng", validity: "30 ngày", price: 300000, status: "ACTIVE" },
  { id: "TT5", name: "Vé tháng HSSV", validity: "30 ngày", price: 150000, status: "ACTIVE" },
]);
export const distancePricesStore = createStore([
  { id: "P1", from: 0, to: 5, price: 7000, effective: "01/01/2026" },
  { id: "P2", from: 5, to: 10, price: 12000, effective: "01/01/2026" },
  { id: "P3", from: 10, to: 15, price: 16000, effective: "01/01/2026" },
  { id: "P4", from: 15, to: 20, price: 20000, effective: "01/01/2026" },
]);

export const parkingLots = [
  {
    id: "PK1",
    name: "Bãi Suối Tiên",
    stationId: "S1-14",
    moto: 1200,
    car: 150,
    bike: 200,
    used: 0.72,
  },
  { id: "PK2", name: "Bãi Thủ Đức", stationId: "S1-11", moto: 800, car: 60, bike: 120, used: 0.88 },
  {
    id: "PK3",
    name: "Bãi Rạch Chiếc",
    stationId: "S1-8",
    moto: 600,
    car: 80,
    bike: 80,
    used: 0.41,
  },
  { id: "PK4", name: "Bãi An Phú", stationId: "S1-7", moto: 500, car: 40, bike: 60, used: 0.65 },
];
export const parkingPricesStore = createStore([
  { id: "PP1", vehicle: "Xe đạp", unit: "Lượt", price: 2000 },
  { id: "PP2", vehicle: "Xe máy", unit: "Lượt", price: 5000 },
  { id: "PP3", vehicle: "Xe máy", unit: "Tháng", price: 120000 },
  { id: "PP4", vehicle: "Ô tô", unit: "Giờ", price: 20000 },
  { id: "PP5", vehicle: "Ô tô", unit: "Ngày", price: 120000 },
]);

export type Promo = {
  id: string;
  name: string;
  discount: number;
  start: string;
  end: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "EXPIRED";
};
export const promosStore = createStore<Promo[]>([
  {
    id: "KM1",
    name: "Chào mừng khai trương",
    discount: 50,
    start: "2026-01-01",
    end: "2026-01-31",
    status: "EXPIRED",
  },
  {
    id: "KM2",
    name: "Thứ Tư xanh",
    discount: 15,
    start: "2026-09-01",
    end: "2026-12-31",
    status: "ACTIVE",
  },
  {
    id: "KM3",
    name: "Gia đình cuối tuần",
    discount: 10,
    start: "2026-10-01",
    end: "2026-11-30",
    status: "INACTIVE",
  },
]);
export const tiersStore = createStore([
  { id: "M1", name: "Đồng", threshold: 0, multiplier: 1, benefits: "Tích điểm cơ bản" },
  { id: "M2", name: "Bạc", threshold: 500, multiplier: 1.2, benefits: "Giảm 5% vé tháng" },
  {
    id: "M3",
    name: "Vàng",
    threshold: 2000,
    multiplier: 1.5,
    benefits: "Giảm 10% vé tháng, ưu tiên gửi xe",
  },
  {
    id: "M4",
    name: "Kim cương",
    threshold: 5000,
    multiplier: 2,
    benefits: "Giảm 15%, 2 lượt gửi xe miễn phí/tháng",
  },
]);
export type Notice = { id: string; title: string; body: string; audience: string; at: string };
export const noticesStore = createStore<Notice[]>([
  {
    id: "N1",
    title: "Điều chỉnh giờ chạy dịp lễ",
    body: "Tăng chuyến đến 23:00 ngày 2/9.",
    audience: "Tất cả",
    at: "2026-08-30 09:00",
  },
  {
    id: "N2",
    title: "Bảo trì thang cuốn ga Ba Son",
    body: "Thang cuốn lối B tạm dừng 2 ngày.",
    audience: "Hành khách",
    at: "2026-10-05 07:30",
  },
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
    const amount = [7000, 12000, 16000, 40000, 300000, 5000, 20000][i % 7];
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
