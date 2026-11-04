import { Activity, Crown, Receipt, Wallet } from "lucide-react";
import { money, StatCard } from "@/components/shared";
import { metricValue, rankOf, shortMoney } from "@/pages/reports/reports.service";
import type { ReportMetric, ReportTotals, StationReportRow } from "@/pages/reports/reports.types";

const count = (value: number) => value.toLocaleString("vi-VN");

/** Bốn chỉ số cố định, không đổi theo loại thống kê để luôn thấy cả doanh thu lẫn lưu lượng. */
export function ReportSummary({
  totals,
  metric,
  rows,
  focus,
}: {
  totals: ReportTotals;
  metric: ReportMetric;
  /** Đã sắp xếp theo `metric`. */
  rows: StationReportRow[];
  focus: StationReportRow | null;
}) {
  const metricName = metric === "revenue" ? "doanh thu" : "lưu lượng";
  const format = (row: StationReportRow) =>
    metric === "revenue" ? money(row.revenue) : `${count(metricValue(row, metric))} lượt`;
  const top = rows[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Doanh thu thuần"
        icon={Wallet}
        value={shortMoney(totals.netRevenue)}
        hint={`Gộp ${money(totals.revenue)} · hoàn ${money(totals.refund)}`}
      />
      <StatCard
        label="Tổng lưu lượng"
        icon={Activity}
        tone="success"
        value={count(totals.flow)}
        hint={`Vào ${count(totals.entries)} · ra ${count(totals.exits)}`}
      />
      <StatCard
        label="Số giao dịch"
        icon={Receipt}
        tone="muted"
        value={count(totals.transactions)}
        hint={`${totals.stationCount} ga · ${totals.days} ngày`}
      />
      {focus ? (
        <StatCard
          label={`Xếp hạng ${metricName}`}
          icon={Crown}
          tone="accent"
          value={`#${rankOf(focus, metric)}/${rows.length}`}
          hint={`Ga ${focus.name} trong phạm vi lọc`}
        />
      ) : (
        <StatCard
          label={`Ga dẫn đầu ${metricName}`}
          icon={Crown}
          tone="accent"
          value={top?.name ?? "—"}
          hint={top && format(top)}
        />
      )}
    </div>
  );
}
