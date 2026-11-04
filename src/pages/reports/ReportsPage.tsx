import { Download } from "lucide-react";
import { lazy, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ChartBoundary } from "@/components/chart-boundary";
import { ExportDialog } from "@/pages/reports/components/ExportDialog";
import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getActorName } from "@/lib/auth/session.store";
import { hourlyFlow } from "@/mocks/metro";
import { ReportFilters } from "@/pages/reports/components/ReportFilters";
import { ReportSummary } from "@/pages/reports/components/ReportSummary";
import { StationReportTable } from "@/pages/reports/components/StationReportTable";
import { useReports } from "@/pages/reports/hooks/useReports";
import { buildReportExport, hourlyProfile } from "@/pages/reports/reports.service";

const TrendChart = lazy(() =>
  import("@/pages/reports/components/ReportCharts").then((m) => ({ default: m.TrendChart })),
);
const HourlyChart = lazy(() =>
  import("@/pages/reports/components/ReportCharts").then((m) => ({ default: m.HourlyChart })),
);

/**
 * Thống kê doanh thu và lưu lượng (UC15) trên một trang: một bộ lọc, một nguồn số liệu.
 * Mỗi loại thống kê chỉ hiện phần của nó, nên không có khối nào lặp lại ở nơi khác.
 */
export function ReportsPage() {
  const r = useReports();
  const { invalid, totals, trend } = r.report;
  const showHourly = r.metric === "flow" && r.canSeeHourly;

  const hourly = useMemo(
    () => (showHourly ? hourlyProfile(hourlyFlow, r.stations, r.filters) : []),
    [showHourly, r.stations, r.filters],
  );
  const peak = hourly.reduce((best, point) => (point.luot > best.luot ? point : best), {
    hour: "—",
    luot: 0,
  });
  const empty = !invalid && !totals.days;
  const exported = r.exportOpen
    ? buildReportExport(r.rows, totals, r.filters, r.scopeName, getActorName())
    : null;

  return (
    <AppShell
      title="Thống kê & báo cáo"
      actions={
        r.canExport && (
          <Button onClick={() => r.setExportOpen(true)} disabled={invalid || empty}>
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        )
      }
    >
      <ReportFilters
        lines={r.lines}
        stations={r.scopeStations}
        filters={r.filters}
        onFiltersChange={r.setFilters}
        metric={r.metric}
        onMetricChange={r.setMetric}
      />
      {invalid && <p className="text-sm text-destructive">Khoảng thời gian không hợp lệ</p>}
      {empty && (
        <Section title="Kết quả">
          <p className="py-10 text-center text-muted-foreground">
            Không có dữ liệu trong khoảng thời gian này
          </p>
        </Section>
      )}
      {!invalid && !empty && (
        <>
          <ReportSummary totals={totals} metric={r.metric} rows={r.rows} focus={r.focus} />
          <div className={showHourly ? "grid gap-6 xl:grid-cols-2" : undefined}>
            <Section
              title={`${r.metric === "revenue" ? "Doanh thu" : "Lưu lượng"} theo ngày · ${r.scopeName}`}
            >
              <ChartBoundary className="h-64">
                <TrendChart data={trend} metric={r.metric} />
              </ChartBoundary>
            </Section>
            {showHourly && (
              <Section
                title={`Theo giờ · ${r.scopeName}`}
                description={`Ngày điển hình, cao điểm ${peak.hour} với khoảng ${peak.luot.toLocaleString("vi-VN")} lượt`}
              >
                <ChartBoundary className="h-64">
                  <HourlyChart data={hourly} peak={peak.luot} />
                </ChartBoundary>
              </Section>
            )}
          </div>
          <StationReportTable
            rows={r.rows}
            metric={r.metric}
            focusId={r.filters.stationId}
            onToggle={r.toggleStation}
          />
        </>
      )}
      {exported && <ExportDialog open onClose={() => r.setExportOpen(false)} report={exported} />}
    </AppShell>
  );
}
