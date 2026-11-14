import type { PaymentMethod, PaymentPurpose, PaymentStatus, SepayResult } from "@/lib/api";
import type { TransactionFilters } from "@/pages/transactions/transactions.types";

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  q: "",
  status: "ALL",
  purpose: "ALL",
  from: "",
  to: "",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  SUCCEEDED: "Thành công",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

/** Mã trạng thái dùng cho màu của `StatusBadge`. */
export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  SUCCEEDED: "SUCCESS",
  REFUND_PENDING: "PENDING",
  REFUNDED: "REFUNDED",
};

export const PAYMENT_PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  TICKET: "Vé",
  TICKET_FARE_ADJUSTMENT: "Bù giá vé",
  PARKING_SESSION: "Gửi xe theo lượt",
  PARKING_MONTHLY_PASS: "Vé tháng gửi xe",
  PARKING_BOOKING: "Đặt chỗ gửi xe",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  CARD: "Thẻ",
  E_WALLET: "Ví điện tử",
  BANK_TRANSFER: "Chuyển khoản",
  SEPAY_QR: "QR SePay",
};

export const SEPAY_RESULT_LABEL: Record<SepayResult, string> = {
  MATCHED: "Khớp",
  UNMATCHED: "Không có đơn tương ứng",
  AMOUNT_MISMATCH: "Lệch số tiền",
  NEEDS_REFUND: "Cần hoàn tiền",
  IGNORED: "Bỏ qua",
};
