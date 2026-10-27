import { Section } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReconciliationDateFilters } from "@/pages/reconciliation/components/ReconciliationDateFilters";
import { ReconciliationSelectionSummary } from "@/pages/reconciliation/components/ReconciliationSelectionSummary";
import { ReconciliationTransactionTable } from "@/pages/reconciliation/components/ReconciliationTransactionTable";
import { useReconciliation } from "@/pages/reconciliation/hooks/useReconciliation";

export function ReconciliationPanel() {
  const {
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
    selectAll,
    confirm,
  } = useReconciliation();

  return (
    <>
      <Section
        title="Giao dịch chưa đối soát"
        description={
          canConfirm
            ? undefined
            : "Chỉ xem — việc đối soát với cổng thanh toán do Kế toán thực hiện."
        }
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
        {!canConfirm && (
          <Alert className="mb-3">
            <AlertDescription>
              Admin chỉ xem danh sách giao dịch chưa đối soát. Thao tác chọn và xác nhận "Đã đối
              soát" chỉ dành cho Kế toán.
            </AlertDescription>
          </Alert>
        )}
        {canConfirm && (
          <ReconciliationSelectionSummary
            selectedCount={picked.size}
            selectedAmount={selectedAmount}
            rowCount={rows.length}
            onSelectAll={selectAll}
            onConfirm={confirm}
          />
        )}
        <ReconciliationTransactionTable
          rows={rows}
          picked={picked}
          onToggle={toggle}
          readOnly={!canConfirm}
        />
      </Section>
    </>
  );
}
