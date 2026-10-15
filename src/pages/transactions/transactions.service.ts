import type { Txn } from "@/mocks/admin";
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
