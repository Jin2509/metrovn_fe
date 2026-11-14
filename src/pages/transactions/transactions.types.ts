import type { PaymentPurpose, PaymentStatus } from "@/lib/api";

export type TransactionFilters = {
  /** Mã giao dịch của cổng thanh toán (tìm gần đúng). */
  q: string;
  status: PaymentStatus | "ALL";
  purpose: PaymentPurpose | "ALL";
  /** yyyy-MM-dd */
  from: string;
  to: string;
};
