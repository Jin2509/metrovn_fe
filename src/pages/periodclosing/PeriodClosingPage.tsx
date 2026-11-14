import { AppShell } from "@/components/app-shell";
import { LoadState } from "@/components/shared";
import { PeriodCloseDialog } from "@/pages/periodclosing/components/PeriodCloseDialog";
import { PeriodSummaryTable } from "@/pages/periodclosing/components/PeriodSummaryTable";
import { usePeriodClosing } from "@/pages/periodclosing/hooks/usePeriodClosing";

export function PeriodClosingPage() {
  const {
    periods,
    pendingRefundCount,
    selectedMonth,
    selectMonth,
    closeDialog,
    confirmClose,
    loading,
    loadError,
    reload,
  } = usePeriodClosing();

  return (
    <AppShell title="Chốt kỳ / quyết toán">
      <LoadState loading={loading} error={loadError} onRetry={reload} />
      <PeriodSummaryTable periods={periods} onSelectPeriod={selectMonth} />
      <PeriodCloseDialog
        month={selectedMonth}
        pendingRefundCount={pendingRefundCount}
        onClose={closeDialog}
        onConfirm={confirmClose}
      />
    </AppShell>
  );
}
