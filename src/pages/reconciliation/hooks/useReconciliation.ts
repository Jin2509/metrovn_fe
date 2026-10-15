import { useState } from "react";
import { toast } from "sonner";
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
  const transactions = txnStore.use();
  const periods = periodsStore.use();
  const [from, setFrom] = useState(RECONCILIATION_DEFAULT_FROM);
  const [to, setTo] = useState(RECONCILIATION_DEFAULT_TO);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const invalid = from > to;
  const rows = filterReconciliationRows(transactions, periods, from, to);
  const selectedAmount = calculateSelectedAmount(rows, picked);

  const toggle = (transactionId: string) =>
    setPicked((selected) => {
      const nextSelection = new Set(selected);
      if (nextSelection.has(transactionId)) nextSelection.delete(transactionId);
      else nextSelection.add(transactionId);
      return nextSelection;
    });

  const confirm = () => {
    reconcileTransactions(picked);
    toast.success(`Đã đối soát ${picked.size} giao dịch`);
    setPicked(new Set());
  };

  return {
    from,
    setFrom,
    to,
    setTo,
    invalid,
    rows,
    picked,
    selectedAmount,
    toggle,
    selectAll: () => setPicked(new Set(rows.map((row) => row.id))),
    confirm,
  };
}
