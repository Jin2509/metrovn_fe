import type {
  TransactionFilterKey,
  TransactionFilters,
} from "@/pages/transactions/transactions.types";

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  q: "",
  status: "ALL",
  method: "ALL",
  gateway: "ALL",
  rec: "ALL",
  from: "",
  to: "",
};

export const TRANSACTION_FILTER_OPTIONS: Record<TransactionFilterKey, [string, string][]> = {
  status: [
    ["ALL", "Mọi trạng thái"],
    ["PENDING", "PENDING"],
    ["SUCCESS", "SUCCESS"],
    ["FAILED", "FAILED"],
    ["REFUNDED", "REFUNDED"],
  ],
  method: [
    ["ALL", "Mọi phương thức"],
    ["Ví điện tử", "Ví điện tử"],
    ["Thẻ ngân hàng", "Thẻ ngân hàng"],
    ["QR", "QR"],
  ],
  gateway: [
    ["ALL", "Mọi cổng"],
    ["MoMo", "MoMo"],
    ["VNPay", "VNPay"],
    ["ZaloPay", "ZaloPay"],
  ],
  rec: [
    ["ALL", "Đối soát: tất cả"],
    ["true", "Đã đối soát"],
    ["false", "Chưa đối soát"],
  ],
};
