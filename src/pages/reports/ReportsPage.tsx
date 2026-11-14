import { FileSpreadsheet, FileText } from "lucide-react";
import { lazy, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ChartBoundary } from "@/components/chart-boundary";
import { DataTable, LoadState, money, Section, StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Report, ReportFormat } from "@/lib/api";
import { useReports } from "@/pages/reports/hooks/useReports";
import { shortMoney, withShare } from "@/pages/reports/reports.service";

const ReportBarChart = lazy(() =>
  import("@/pages/reports/components/ReportCharts").then((m) => ({ default: m.ReportBarChart })),
);

function GroupTabs<G extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: G;
  options: [G, string][];
  onChange: (value: G) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as G)}>
      <TabsList aria-label={label}>
        {options.map(([v, text]) => (
          <TabsTrigger key={v} value={v}>
            {text}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function ExportButtons({
  kind,
  exporting,
  disabled,
  onExport,
}: {
  kind: "revenue" | "traffic";
  exporting: string;
  disabled: boolean;
  onExport: (kind: "revenue" | "traffic", format: ReportFormat) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || !!exporting}
        onClick={() => onExport(kind, "xlsx")}
      >
        <FileSpreadsheet className="h-4 w-4" aria-hidden />
        {exporting === `${kind}-xlsx` ? "Đang xuất…" : "Excel"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || !!exporting}
        onClick={() => onExport(kind, "pdf")}
      >
        <FileText className="h-4 w-4" aria-hidden />
        {exporting === `${kind}-pdf` ? "Đang xuất…" : "PDF"}
      </Button>
    </div>
  );
}

/** Bảng các dòng báo cáo kèm tỉ trọng. */
function ShareTable({
  report,
  label,
  money: isMoney,
}: {
  report: Report;
  label: string;
  money: boolean;
}) {
  const rows = withShare(report.rows);
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.label}
      pageSize={15}
      empty="Không có dữ liệu trong khoảng thời gian này"
      cols={[
        { h: label, c: (r) => <b>{r.label}</b> },
        ...(isMoney
          ? [
              {
                h: "Doanh thu",
                className: "text-right",
                c: (r: (typeof rows)[number]) => money(r.amountVnd ?? 0),
              },
            ]
          : []),
        {
          h: isMoney ? "Số giao dịch" : "Lượt",
          className: "text-right",
          c: (r) => r.count.toLocaleString("vi-VN"),
        },
        {
          h: "Tỉ trọng",
          c: (r) => (
            <div className="flex w-36 items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${r.share * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs">{Math.round(r.share * 100)}%</span>
            </div>
          ),
        },
      ]}
    />
  );
}

function ReportBody({
  state,
  children,
}: {
  state: { data?: Report; loading: boolean; error: string; retry: () => void };
  children: (report: Report) => ReactNode;
}) {
  return (
    <>
      <LoadState loading={state.loading} error={state.error} onRetry={state.retry} />
      {state.data && children(state.data)}
    </>
  );
}

/** Thống kê doanh thu và lưu lượng (UC15) lấy từ báo cáo tổng hợp của backend. */
export function ReportsPage() {
  const r = useReports();
  const revenue = r.trendReport.data;

  return (
    <AppShell title="Thống kê & báo cáo">
      <Section
        title="Kỳ báo cáo"
        description="Mỗi lần xem hoặc xuất báo cáo được ghi vào nhật ký thao tác."
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="report-from">Từ ngày</Label>
            <Input
              id="report-from"
              type="date"
              className="w-44"
              value={r.from}
              aria-invalid={r.invalid}
              aria-describedby={r.invalid ? "report-range-error" : undefined}
              onChange={(e) => r.setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="report-to">Đến ngày</Label>
            <Input
              id="report-to"
              type="date"
              className="w-44"
              value={r.to}
              aria-invalid={r.invalid}
              aria-describedby={r.invalid ? "report-range-error" : undefined}
              onChange={(e) => r.setTo(e.target.value)}
            />
          </div>
        </div>
        <div role="status">
          {r.invalid && (
            <p id="report-range-error" className="mt-2 text-sm text-destructive">
              Khoảng thời gian không hợp lệ
            </p>
          )}
        </div>
      </Section>

      {!r.canRevenue && !r.canTraffic && (
        <p className="text-sm text-muted-foreground">
          Tài khoản chưa có quyền xem báo cáo (REPORT_VIEW, REPORT_TRAFFIC_VIEW).
        </p>
      )}

      {r.canRevenue && !r.invalid && (
        <>
          {revenue && (
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Doanh thu"
                value={shortMoney(revenue.totalAmountVnd ?? 0)}
                hint={money(revenue.totalAmountVnd ?? 0)}
                tone="success"
              />
              <StatCard
                label="Số giao dịch"
                value={revenue.totalCount.toLocaleString("vi-VN")}
                tone="primary"
              />
            </div>
          )}
          <Section
            title="Doanh thu theo thời gian"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <GroupTabs
                  label="Nhóm doanh thu theo"
                  value={r.trend}
                  onChange={r.setTrend}
                  options={[
                    ["DAY", "Ngày"],
                    ["MONTH", "Tháng"],
                  ]}
                />
                {r.canExport && (
                  <ExportButtons
                    kind="revenue"
                    exporting={r.exporting}
                    disabled={r.invalid}
                    onExport={(k, f) => void r.exportReport(k, f)}
                  />
                )}
              </div>
            }
          >
            <ReportBody state={r.trendReport}>
              {(report) =>
                report.rows.length ? (
                  <ChartBoundary className="h-64">
                    <ReportBarChart rows={report.rows} money />
                  </ChartBoundary>
                ) : (
                  <p className="py-10 text-center text-muted-foreground">
                    Không có doanh thu trong khoảng thời gian này
                  </p>
                )
              }
            </ReportBody>
          </Section>
          <Section
            title="Cơ cấu doanh thu"
            action={
              <GroupTabs
                label="Phân tích doanh thu theo"
                value={r.breakdown}
                onChange={r.setBreakdown}
                options={[
                  ["SERVICE", "Dịch vụ"],
                  ["PRODUCT", "Loại vé"],
                ]}
              />
            }
          >
            <ReportBody state={r.breakdownReport}>
              {(report) => (
                <ShareTable
                  report={report}
                  label={r.breakdown === "SERVICE" ? "Dịch vụ" : "Loại vé"}
                  money
                />
              )}
            </ReportBody>
          </Section>
        </>
      )}

      {r.canTraffic && !r.invalid && (
        <Section
          title="Lưu lượng hành khách"
          description="Số lượt qua cổng soát vé."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <GroupTabs
                label="Nhóm lưu lượng theo"
                value={r.traffic}
                onChange={r.setTraffic}
                options={[
                  ["STATION", "Ga"],
                  ["LINE", "Tuyến"],
                  ["HOUR", "Giờ"],
                ]}
              />
              {r.canExport && (
                <ExportButtons
                  kind="traffic"
                  exporting={r.exporting}
                  disabled={r.invalid}
                  onExport={(k, f) => void r.exportReport(k, f)}
                />
              )}
            </div>
          }
        >
          <ReportBody state={r.trafficReport}>
            {(report) => (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tổng{" "}
                  <b className="text-foreground">{report.totalCount.toLocaleString("vi-VN")}</b>{" "}
                  lượt
                </p>
                {r.traffic === "HOUR" ? (
                  <ChartBoundary className="h-64">
                    <ReportBarChart rows={report.rows} money={false} />
                  </ChartBoundary>
                ) : (
                  <ShareTable
                    report={report}
                    label={r.traffic === "STATION" ? "Ga" : "Tuyến"}
                    money={false}
                  />
                )}
              </div>
            )}
          </ReportBody>
        </Section>
      )}
    </AppShell>
  );
}
