import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type {
  Page,
  PageQuery,
  PaymentOrderStatus,
  PaymentOrderView,
  PaymentStatus,
  PaymentView,
  ReconcileNote,
  ReconcileResult,
  SepayResult,
  SepayTransactionView,
  TransactionPage,
  TransactionQuery,
} from "./types";

// Giao dịch, đơn thanh toán, đối soát SePay: cần PAYMENT_MANAGE. Danh sách luôn mới nhất trước.
const ADMIN = `${V1}/admin`;

export const transactionsApi = {
  /** Mỗi lần gọi được ghi vào nhật ký thao tác (TRANSACTION_SEARCH). */
  list: (query: TransactionQuery = {}) =>
    apiRequest<TransactionPage>(`${ADMIN}/transactions`, { query }),
  /** Đối chiếu giao dịch SePay với hệ thống trong khoảng `from`..`to` (ISO-8601). */
  reconcile: (from: string, to: string) =>
    apiRequest<ReconcileResult>(`${ADMIN}/reconciliations`, {
      method: "POST",
      body: { from, to },
    }),
  /** Ghi chú xử lý cho giao dịch SePay lệch; đánh dấu đã đối soát. */
  noteSepay: (sepayId: number, note: string) =>
    apiRequest<ReconcileNote>(`${ADMIN}/sepay-transactions/${seg(sepayId)}/note`, {
      method: "PUT",
      body: { note },
    }),
};

export const paymentsApi = {
  orders: (query: PageQuery & { status?: PaymentOrderStatus } = {}) =>
    apiRequest<Page<PaymentOrderView>>(`${ADMIN}/payment-orders`, { query }),
  sepayTransactions: (query: PageQuery & { result?: SepayResult } = {}) =>
    apiRequest<Page<SepayTransactionView>>(`${ADMIN}/sepay-transactions`, { query }),
  /** `status` mặc định REFUND_PENDING (chờ hoàn tiền). */
  byStatus: (query: PageQuery & { status?: PaymentStatus } = {}) =>
    apiRequest<Page<PaymentView>>(`${ADMIN}/payments`, { query }),
  /** Xác nhận đã chuyển hoàn tiền cho khách. */
  confirmRefunded: (paymentId: string) =>
    apiRequest<PaymentView>(`${ADMIN}/payments/${seg(paymentId)}/refunded`, { method: "POST" }),
};
