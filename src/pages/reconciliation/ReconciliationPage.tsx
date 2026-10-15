import { AppShell } from "@/components/app-shell";
import { Section } from "@/components/shared";
import { ReconciliationDateFilters } from "@/pages/reconciliation/components/ReconciliationDateFilters";
import { ReconciliationSelectionSummary } from "@/pages/reconciliation/components/ReconciliationSelectionSummary";
import { ReconciliationTransactionTable } from "@/pages/reconciliation/components/ReconciliationTransactionTable";
import { useReconciliation } from "@/pages/reconciliation/hooks/useReconciliation";

export function ReconciliationPage() {
  const {
    from,
    setFrom,
    to,
    setTo,
    invalid,
    rows,
    picked,
    selectedAmount,
    toggle,
    selectAll,
    confirm,
  } = useReconciliation();

  return (
    <AppShell title="Đối soát giao dịch" roles={["ADMIN", "ACCOUNTANT"]}>
      <Section
        title="Giao dịch chưa đối soát"
        action={
          <ReconciliationDateFilters
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
          />
        }
      >
        {invalid && <p className="mb-3 text-sm text-destructive">Khoảng thời gian không hợp lệ</p>}
        <ReconciliationSelectionSummary
          selectedCount={picked.size}
          selectedAmount={selectedAmount}
          rowCount={rows.length}
          onSelectAll={selectAll}
          onConfirm={confirm}
        />
        <ReconciliationTransactionTable rows={rows} picked={picked} onToggle={toggle} />
      </Section>
    </AppShell>
  );
}
