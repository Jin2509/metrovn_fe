import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { periodsStore, txnStore, type Txn } from "@/mocks/admin";
import {
  filterTransactions,
  isReconcilable,
  reconcileTransactions,
} from "@/pages/transactions/transactions.service";
import { DEFAULT_TRANSACTION_FILTERS } from "@/pages/transactions/transactions.constants";
import type { TransactionFilters } from "@/pages/transactions/transactions.types";

export function useTransactions(initialRec?: string) {
  const { can } = useAuth();
  const canReconcile = can("reconciliation.confirm");
  const transactions = txnStore.use();
  const closedMonths = periodsStore
    .use()
    .filter((period) => period.closed)
    .map((period) => period.month);
  const [filters, setFilters] = useState<TransactionFilters>({
    ...DEFAULT_TRANSACTION_FILTERS,
    rec: initialRec ?? DEFAULT_TRANSACTION_FILTERS.rec,
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Txn | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const rows = filterTransactions(transactions, filters);
  const reconcilable = canReconcile ? rows.filter((t) => isReconcilable(t, closedMonths)) : [];
  // Chỉ tính dòng còn trong bộ lọc: giao dịch đang bị lọc mất không được đối soát ngầm.
  const pickedRows = reconcilable.filter((t) => picked.has(t.id));

  return {
    filters,
    setFilters,
    rows,
    selectedTransaction,
    selectTransaction: setSelectedTransaction,
    canReconcile,
    reconcilable,
    canPick: (transaction: Txn) => canReconcile && isReconcilable(transaction, closedMonths),
    isPicked: (id: string) => picked.has(id),
    pickedCount: pickedRows.length,
    pickedAmount: pickedRows.reduce((total, t) => total + t.amount, 0),
    togglePick: (id: string) =>
      setPicked((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    pickAll: () => setPicked(new Set(reconcilable.map((t) => t.id))),
    confirmReconcile: () => {
      reconcileTransactions(pickedRows.map((t) => t.id));
      toast.success(`Đã đối soát ${pickedRows.length} giao dịch`);
      setPicked(new Set());
    },
  };
}
