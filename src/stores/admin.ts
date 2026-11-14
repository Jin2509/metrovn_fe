import { getActorName } from "@/lib/auth/session.store";
import { createStore } from "@/lib/store";

// Kho trạng thái phía client, nạp từ backend qua `@/lib/api` (xem hook `use*Data` của từng trang).
/** Các mục backend có luồng duyệt riêng; Hộp phê duyệt gom chúng lại cho Manager. */
export type ApprovalType = "OPERATION" | "TICKET_PRICE" | "ANNOUNCEMENT";
export const approvalLabel: Record<ApprovalType, string> = {
  OPERATION: "Cấu hình vận hành",
  TICKET_PRICE: "Giá vé",
  ANNOUNCEMENT: "Thông báo vận hành",
};
export type Approval = {
  /** `${type}:${mã trên backend}`, ví dụ `OPERATION:12`. */
  id: string;
  type: ApprovalType;
  /** Mã bản ghi trên backend. */
  sourceId: number;
  title: string;
  /** Mã tài khoản (UUID) người gửi; hiển thị tên qua `useUserNames`. */
  by: string | null;
  /** Instant ISO. */
  at: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  changes: { field: string; old: string; new: string }[];
  reason?: string;
  /** Mã tài khoản người duyệt. */
  decidedBy?: string | null;
  /** Yêu cầu của Manager mà đề xuất này thực hiện (xem `approvalLinksStore`). */
  workRequestId?: string;
};
// Mới nhất đứng đầu. Nạp từ backend bằng `useApprovalsData` (pages/approvals).
export const approvalsStore = createStore<Approval[]>([]);

export type Audit = { id: string; at: string; actor: string; action: string; target: string };
export const auditStore = createStore<Audit[]>([]);
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

/** Loại vé (bảng `ticket_product`). Giá chỉ đổi qua bảng giá chờ Manager duyệt. */
export type TicketTypeRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  durationUnit: "DAY" | "WEEK" | "MONTH";
  durationValue: number;
  price: number;
  maxPeriods: number;
  activationWindowDays: number;
  status: "ACTIVE" | "INACTIVE";
  hasSoldTickets: boolean;
  /** Gửi lại khi sửa để chống ghi đè. */
  version: number;
};
export const ticketTypesStore = createStore<TicketTypeRow[]>([]);
const DURATION_UNIT_LABEL = { DAY: "ngày", WEEK: "tuần", MONTH: "tháng" } as const;
/** Thời hạn dễ đọc, ví dụ "1 ngày", "3 tháng". */
export function formatValidity(ticket: Pick<TicketTypeRow, "durationUnit" | "durationValue">) {
  return `${ticket.durationValue} ${DURATION_UNIT_LABEL[ticket.durationUnit]}`;
}

export type VehicleType = "BICYCLE" | "MOTORBIKE" | "CAR";
export const VEHICLE_LABEL: Record<VehicleType, string> = {
  BICYCLE: "Xe đạp",
  MOTORBIKE: "Xe máy",
  CAR: "Ô tô",
};

export type ParkingLotRow = {
  id: string;
  code: string;
  name: string;
  stationId: string;
  address: string;
  /** HH:mm */
  openTime: string;
  closeTime: string;
  bike: number;
  moto: number;
  car: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  /** Tỉ lệ lấp đầy 0..1, backend tính từ lượt gửi xe đang trong bãi. */
  used: number;
};
export const parkingLotsStore = createStore<ParkingLotRow[]>([]);
/** Giá và sức chứa của một loại xe tại một bãi. `id` = `${lotId}:${vehicleType}`. */
export type ParkingPriceRow = {
  id: string;
  lotId: string;
  lotName: string;
  vehicleType: VehicleType;
  capacity: number;
  occupied: number;
  dayPrice: number;
  overnightPrice: number;
  monthlyPrice: number;
  parkAndRideDiscountPercent: number;
};
export const parkingPricesStore = createStore<ParkingPriceRow[]>([]);

/** Kỳ kế toán theo tháng. Doanh thu lấy từ báo cáo backend; backend chưa có API chốt kỳ. */
export type PeriodRow = {
  /** MM/yyyy */
  month: string;
  revenue: number;
  /** Số giao dịch thanh toán trong tháng. */
  transactions: number;
  closed: boolean;
};
export const periodsStore = createStore<PeriodRow[]>([]);
/** Các kỳ đã chốt (MM/yyyy). Chỉ lưu trong phiên hiện tại cho tới khi backend có API chốt kỳ. */
export const closedMonthsStore = createStore<string[]>([]);
