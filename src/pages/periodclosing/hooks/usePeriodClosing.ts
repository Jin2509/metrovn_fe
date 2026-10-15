import { useState } from "react";
import { toast } from "sonner";
import { periodsStore, txnStore } from "@/mocks/admin";
import { closeAccountingPeriod } from "@/pages/periodclosing/periodclosing.service";

export function usePeriodClosing() {
  const periods = periodsStore.use();
  const transactions = txnStore.use();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const pendingReconciliationCount = transactions.filter(
    (transaction) => transaction.status === "SUCCESS" && !transaction.reconciled,
  ).length;

  const confirmClose = () => {
    closeAccountingPeriod(selectedMonth);
    toast.success(`Đã chốt kỳ ${selectedMonth}`);
  };

  return {
    periods,
    pendingReconciliationCount,
    selectedMonth,
    selectMonth: setSelectedMonth,
    closeDialog: () => setSelectedMonth(null),
    confirmClose,
  };
}
