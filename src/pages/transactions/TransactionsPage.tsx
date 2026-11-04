import { AppShell } from "@/components/app-shell";
import { money, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { TransactionDetailSheet } from "@/pages/transactions/components/TransactionDetailSheet";
import { TransactionFilters } from "@/pages/transactions/components/TransactionFilters";
import { TransactionsTable } from "@/pages/transactions/components/TransactionsTable";
import { useTransactions } from "@/pages/transactions/hooks/useTransactions";

export function TransactionsPage({ initialRec }: { initialRec?: string }) {
  const t = useTransactions(initialRec);

  return (
    <AppShell title="Giao dịch & đối soát">
      <Section
        title="Giao dịch"
        description={
          t.canReconcile
            ? "Tick các giao dịch đã khớp với cổng thanh toán rồi xác nhận đối soát. Giao dịch thuộc kỳ đã chốt không đối soát được."
            : "Chỉ xem. Việc xác nhận đối soát do Kế toán thực hiện."
        }
      >
        <TransactionFilters filters={t.filters} onFiltersChange={t.setFilters} />
        {t.canReconcile && t.reconcilable.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3 text-sm">
            <span>
              Đã chọn <b>{t.pickedCount}</b> giao dịch · Tổng <b>{money(t.pickedAmount)}</b>
            </span>
            <Button size="sm" variant="outline" onClick={t.pickAll}>
              Chọn tất cả ({t.reconcilable.length})
            </Button>
            <Button
              size="sm"
              className="ml-auto"
              disabled={!t.pickedCount}
              onClick={t.confirmReconcile}
            >
              Xác nhận đã đối soát
            </Button>
          </div>
        )}
        <TransactionsTable
          rows={t.rows}
          onSelect={t.selectTransaction}
          selection={
            t.canReconcile
              ? { canPick: t.canPick, isPicked: t.isPicked, toggle: t.togglePick }
              : undefined
          }
        />
      </Section>
      <TransactionDetailSheet
        transaction={t.selectedTransaction}
        onClose={() => t.selectTransaction(null)}
      />
    </AppShell>
  );
}
