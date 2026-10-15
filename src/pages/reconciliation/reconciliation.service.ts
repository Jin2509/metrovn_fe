import { currentUser, logAction, periodsStore, roleStore, txnStore, type Txn } from "@/mocks/admin";
import type { Period } from "@/pages/reconciliation/reconciliation.types";

export function filterReconciliationRows(
  transactions: Txn[],
  periods: Period[],
  from: string,
  to: string,
) {
  if (from > to) return [];
  const isClosedPeriod = (timestamp: string) =>
    periods.some(
      (period) =>
        period.closed && timestamp.slice(5, 7) + "/" + timestamp.slice(0, 4) === period.month,
    );

  return transactions.filter(
    (transaction) =>
      transaction.status === "SUCCESS" &&
      !transaction.reconciled &&
      transaction.at.slice(0, 10) >= from &&
      transaction.at.slice(0, 10) <= to &&
      !isClosedPeriod(transaction.at),
  );
}

export function calculateSelectedAmount(rows: Txn[], picked: Set<string>) {
  return rows.filter((row) => picked.has(row.id)).reduce((total, row) => total + row.amount, 0);
}

export function reconcileTransactions(picked: Set<string>) {
  const reconciledBy = `${currentUser(roleStore.get())} · ${new Date().toLocaleString("vi-VN")}`;
  txnStore.set((transactions) =>
    transactions.map((transaction) =>
      picked.has(transaction.id) ? { ...transaction, reconciled: true, reconciledBy } : transaction,
    ),
  );
  logAction("Đối soát", `${picked.size} giao dịch`);
}
