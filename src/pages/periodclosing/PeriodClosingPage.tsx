import { AppShell } from "@/components/app-shell";
import { PeriodCloseDialog } from "@/pages/periodclosing/components/PeriodCloseDialog";
import { PeriodSummaryTable } from "@/pages/periodclosing/components/PeriodSummaryTable";
import { usePeriodClosing } from "@/pages/periodclosing/hooks/usePeriodClosing";

export function PeriodClosingPage() {
  const {
    periods,
    pendingReconciliationCount,
    selectedMonth,
    selectMonth,
    closeDialog,
    confirmClose,
  } = usePeriodClosing();

  return (
    <AppShell title="Chốt kỳ / quyết toán" roles={["ACCOUNTANT"]}>
      <PeriodSummaryTable periods={periods} onSelectPeriod={selectMonth} />
      <PeriodCloseDialog
        month={selectedMonth}
        pendingReconciliationCount={pendingReconciliationCount}
        onClose={closeDialog}
        onConfirm={confirmClose}
      />
    </AppShell>
  );
}
