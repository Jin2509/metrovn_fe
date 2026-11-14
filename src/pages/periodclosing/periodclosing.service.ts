import { subMonths } from "date-fns";
import type { Report } from "@/lib/api";
import { todayIso } from "@/lib/query-sync";
import { closedMonthsStore, logAction, periodsStore, type PeriodRow } from "@/stores/admin";

/** Số tháng gần nhất hiển thị trên trang chốt kỳ. */
export const PERIOD_MONTHS = 6;

/** Khoảng ngày của báo cáo: từ ngày 1 của tháng xa nhất tới hôm nay. */
export function periodRange(now = new Date()) {
  const first = subMonths(now, PERIOD_MONTHS - 1);
  first.setDate(1);
  return { from: todayIso(first), to: todayIso(now) };
}

/** Báo cáo doanh thu theo tháng (nhãn `YYYY-MM`) → các kỳ, đủ cả tháng chưa có giao dịch. */
export function toPeriods(report: Report, closed: string[], now = new Date()): PeriodRow[] {
  return Array.from({ length: PERIOD_MONTHS }, (_, i) => {
    const d = subMonths(now, i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const month = `${key.slice(5)}/${key.slice(0, 4)}`;
    const row = report.rows.find((r) => r.label === key);
    return {
      month,
      revenue: row?.amountVnd ?? 0,
      transactions: row?.count ?? 0,
      closed: closed.includes(month),
    };
  });
}

export function closeAccountingPeriod(month: string | null) {
  if (!month) return;
  closedMonthsStore.set((months) => (months.includes(month) ? months : [...months, month]));
  periodsStore.set((periods) =>
    periods.map((period) => (period.month === month ? { ...period, closed: true } : period)),
  );
  logAction("Chốt kỳ", month);
}
