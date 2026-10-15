import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Section } from "@/components/shared";
import { ExportDialog } from "@/components/export-dialog";
import { Button } from "@/components/ui/button";
import { DailyRevenueChart } from "@/pages/revenue/components/DailyRevenueChart";
import { PaymentMethodChart } from "@/pages/revenue/components/PaymentMethodChart";
import { RevenueFilters } from "@/pages/revenue/components/RevenueFilters";
import { RevenueStats } from "@/pages/revenue/components/RevenueStats";
import { RevenueTransactionsTable } from "@/pages/revenue/components/RevenueTransactionsTable";
import { ServiceRevenueChart } from "@/pages/revenue/components/ServiceRevenueChart";
import { useRevenue } from "@/pages/revenue/hooks/useRevenue";
import { money } from "@/components/shared";

export function RevenuePage() {
  const { filters, setFilters, exportOpen, setExportOpen, report, readonly } = useRevenue();
  const { invalid, rows, total, refund, byDay, byService, byMethod } = report;

  return (
    <AppShell
      title={readonly ? "Doanh thu (chỉ xem)" : "Thống kê doanh thu"}
      actions={
        !readonly && (
          <Button onClick={() => setExportOpen(true)} disabled={!rows.length}>
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        )
      }
    >
      <RevenueFilters filters={filters} onFiltersChange={setFilters} />
      {invalid && <p className="text-sm text-destructive">Khoảng thời gian không hợp lệ</p>}
      {!invalid && !rows.length ? (
        <Section title="Kết quả">
          <p className="py-10 text-center text-muted-foreground">Không có dữ liệu</p>
        </Section>
      ) : (
        !invalid && (
          <>
            <RevenueStats total={total} refund={refund} net={total - refund} count={rows.length} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DailyRevenueChart data={byDay} />
              </div>
              <ServiceRevenueChart data={byService} />
            </div>
            <PaymentMethodChart data={byMethod} />
            <RevenueTransactionsTable rows={rows} />
          </>
        )
      )}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        rows={rows}
        title={`Doanh thu ${filters.from} – ${filters.to}`}
      />
    </AppShell>
  );
}
