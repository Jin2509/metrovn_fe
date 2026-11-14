import { AppShell } from "@/components/app-shell";
import { DataTable, LoadState, money, Section, ServerPager } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { fmtInstant } from "@/lib/query-sync";
import { ReconciliationSection } from "@/pages/transactions/components/ReconciliationSection";
import { TransactionDetailSheet } from "@/pages/transactions/components/TransactionDetailSheet";
import { TransactionFilters } from "@/pages/transactions/components/TransactionFilters";
import { TransactionsTable } from "@/pages/transactions/components/TransactionsTable";
import { useTransactions } from "@/pages/transactions/hooks/useTransactions";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_PURPOSE_LABEL,
} from "@/pages/transactions/transactions.constants";

export function TransactionsPage() {
  const t = useTransactions();

  if (!t.canManage)
    return (
      <AppShell title="Giao dịch & đối soát">
        <p className="text-sm text-muted-foreground">
          Tài khoản chưa có quyền xem giao dịch (PAYMENT_MANAGE).
        </p>
      </AppShell>
    );

  return (
    <AppShell title="Giao dịch & đối soát">
      <Section
        title="Giao dịch"
        description="Mỗi lần tra cứu được ghi vào nhật ký thao tác."
        action={
          <span className="text-sm text-muted-foreground">
            Tổng theo bộ lọc: <b className="text-foreground">{money(t.totalAmount)}</b>
          </span>
        }
      >
        <TransactionFilters
          filters={t.filters}
          badRange={t.badRange}
          onFiltersChange={t.setFilters}
        />
        <LoadState loading={t.loading} error={t.loadError} onRetry={t.reload} />
        {!t.loading && !t.loadError && !t.badRange && (
          <>
            <TransactionsTable rows={t.rows} onSelect={t.select} />
            {t.pageInfo && (
              <ServerPager
                label="giao dịch"
                page={t.page}
                totalPages={t.pageInfo.totalPages}
                totalElements={t.pageInfo.totalElements}
                disabled={t.fetching}
                onChange={t.setPage}
              />
            )}
          </>
        )}
      </Section>
      <Section
        title="Chờ hoàn tiền"
        description="Sau khi chuyển tiền cho khách, xác nhận để đóng giao dịch."
      >
        <LoadState error={t.refundsError} />
        <DataTable
          rows={t.refunds}
          rowKey={(p) => p.id}
          empty="Không có giao dịch chờ hoàn tiền"
          cols={[
            { h: "Thời gian", c: (p) => fmtInstant(p.createdAt) },
            { h: "Dịch vụ", c: (p) => PAYMENT_PURPOSE_LABEL[p.purpose] },
            { h: "Số tiền", c: (p) => money(p.amountVnd), className: "text-right" },
            { h: "Phương thức", c: (p) => PAYMENT_METHOD_LABEL[p.method] },
            {
              h: "Thao tác",
              className: "text-right",
              c: (p) => (
                <Button size="sm" disabled={!!t.pending} onClick={() => void t.confirmRefunded(p)}>
                  Đã hoàn tiền
                </Button>
              ),
            },
          ]}
        />
      </Section>
      <ReconciliationSection />
      <TransactionDetailSheet
        transaction={t.selected}
        canManage={t.canManage}
        pending={!!t.pending}
        onConfirmRefunded={(p) => void t.confirmRefunded(p)}
        onClose={() => t.select(null)}
      />
    </AppShell>
  );
}
