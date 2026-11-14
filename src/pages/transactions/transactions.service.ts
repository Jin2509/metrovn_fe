import type { TransactionQuery } from "@/lib/api";
import type { TransactionFilters } from "@/pages/transactions/transactions.types";

export const TRANSACTIONS_KEY = ["payments", "transactions"] as const;
export const REFUNDS_KEY = ["payments", "refund-pending"] as const;
export const PAGE_SIZE = 20;

/** Bộ lọc trên màn hình → tham số của `GET /admin/transactions`. */
export function toTransactionQuery(filters: TransactionFilters, page: number): TransactionQuery {
  return {
    page,
    size: PAGE_SIZE,
    from: filters.from || undefined,
    to: filters.to || undefined,
    status: filters.status === "ALL" ? undefined : filters.status,
    purpose: filters.purpose === "ALL" ? undefined : filters.purpose,
    providerRef: filters.q.trim() || undefined,
  };
}

/** Khoảng ngày bị đảo ngược thì không gửi lên backend. */
export const invalidRange = (filters: Pick<TransactionFilters, "from" | "to">) =>
  !!filters.from && !!filters.to && filters.from > filters.to;

/** Ngày yyyy-MM-dd theo giờ máy → mốc Instant đầu ngày / cuối ngày cho API đối soát. */
export function dayRange(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59.999`);
  return { from: start.toISOString(), to: end.toISOString() };
}
