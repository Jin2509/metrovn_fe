import { STATION_STATS_RANGE } from "@/mocks/station-stats";
import type { ReportFilters, ReportMetric } from "@/pages/reports/reports.types";

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  from: "2026-10-01",
  to: STATION_STATS_RANGE.to,
  lineId: "ALL",
  stationId: "ALL",
};

export const REPORT_METRICS: { value: ReportMetric; label: string }[] = [
  { value: "revenue", label: "Doanh thu" },
  { value: "flow", label: "Lưu lượng" },
];

/** Cột vượt ngưỡng này so với giờ đông nhất được tô là cao điểm. */
export const PEAK_RATIO = 0.8;
