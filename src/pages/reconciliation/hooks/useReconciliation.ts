import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { periodsStore, txnStore } from "@/mocks/admin";
import {
  RECONCILIATION_DEFAULT_FROM,
  RECONCILIATION_DEFAULT_TO,
} from "@/pages/reconciliation/reconciliation.constants";
import {
  calculateSelectedAmount,
  filterReconciliationRows,
  reconcileTransactions,
} from "@/pages/reconciliation/reconciliation.service";

export function useReconciliation() {
  const { can } = useAuth();
  const canConfirm = can("reconciliation.confirm");
  const transactions = txnStore.use();
  const periods = periodsStore.use();
  const [from, setFrom] = useState(RECONCILIATION_DEFAULT_FROM);
  const [to, setTo] = useState(RECONCILIATION_DEFAULT_TO);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const invalid = from > to;
  const rows = filterReconciliationRows(transactions, periods, from, to);
  const selectedAmount = calculateSelectedAmount(rows, picked);

  const toggle = (transactionId: string) => {
    if (!canConfirm) return;
    setPicked((selected) => {
      const nextSelection = new Set(selected);
      if (nextSelection.has(transactionId)) nextSelection.delete(transactionId);
      else nextSelection.add(transactionId);
      return nextSelection;
    });
  };

  const confirm = () => {
    if (!canConfirm) return;
    reconcileTransactions(picked);
    toast.success(`Đã đối soát ${picked.size} giao dịch`);
    setPicked(new Set());
  };

  return {
    canConfirm,
    from,
    setFrom,
    to,
    setTo,
    invalid,
    rows,
    picked,
    selectedAmount,
    toggle,
    selectAll: () => canConfirm && setPicked(new Set(rows.map((row) => row.id))),
    confirm,
  };
}
