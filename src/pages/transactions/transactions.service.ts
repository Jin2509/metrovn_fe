import { getActorName } from "@/lib/auth/session.store";
import { logAction, txnStore, type Txn } from "@/mocks/admin";
import type { TransactionFilters } from "@/pages/transactions/transactions.types";

export function filterTransactions(transactions: Txn[], filters: TransactionFilters) {
  return transactions.filter(
    (transaction) =>
      (filters.status === "ALL" || transaction.status === filters.status) &&
      (filters.method === "ALL" || transaction.method === filters.method) &&
      (filters.gateway === "ALL" || transaction.gateway === filters.gateway) &&
      (filters.rec === "ALL" || String(transaction.reconciled) === filters.rec) &&
      (!filters.from || transaction.at >= filters.from) &&
      (!filters.to || transaction.at.slice(0, 10) <= filters.to) &&
      (transaction.id + transaction.orderId).toLowerCase().includes(filters.q.toLowerCase()),
  );
}

/**
 * Chỉ đối soát được giao dịch thành công, chưa đối soát và không thuộc kỳ đã chốt sổ.
 * `closedMonths` dạng "MM/YYYY", khớp `periodsStore`.
 */
export function isReconcilable(transaction: Txn, closedMonths: string[]) {
  const month = `${transaction.at.slice(5, 7)}/${transaction.at.slice(0, 4)}`;
  return (
    transaction.status === "SUCCESS" && !transaction.reconciled && !closedMonths.includes(month)
  );
}

export function reconcileTransactions(ids: string[]) {
  const reconciledBy = `${getActorName()} · ${new Date().toLocaleString("vi-VN")}`;
  txnStore.set((transactions) =>
    transactions.map((transaction) =>
      ids.includes(transaction.id)
        ? { ...transaction, reconciled: true, reconciledBy }
        : transaction,
    ),
  );
  logAction("Đối soát", `${ids.length} giao dịch`);
}
