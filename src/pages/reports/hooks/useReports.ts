import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { lines, stationsStore } from "@/mocks/metro";
import { stationDailyStats } from "@/mocks/station-stats";
import { DEFAULT_REPORT_FILTERS } from "@/pages/reports/reports.constants";
import { calculateReport, sortRows, stationsInScope } from "@/pages/reports/reports.service";
import type { ReportFilters, ReportMetric } from "@/pages/reports/reports.types";

export function useReports() {
  const { can } = useAuth();
  const stations = stationsStore.use();
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [metric, setMetric] = useState<ReportMetric>("revenue");
  const [exportOpen, setExportOpen] = useState(false);

  // Chỉ tổng hợp lại khi bộ lọc đổi; đổi loại thống kê chỉ sắp xếp lại kết quả có sẵn.
  const report = useMemo(
    () => calculateReport(stationDailyStats, stations, filters),
    [stations, filters],
  );
  const rows = useMemo(() => sortRows(report.rows, metric), [report.rows, metric]);
  const scopeStations = useMemo(
    () => stationsInScope(stations, filters.lineId),
    [stations, filters.lineId],
  );

  const changeFilters = (next: ReportFilters) => {
    // Ga đang xem không thuộc tuyến vừa chọn thì quay về toàn phạm vi.
    const inScope =
      next.stationId === "ALL" ||
      stationsInScope(stations, next.lineId).some((s) => s.id === next.stationId);
    setFilters(inScope ? next : { ...next, stationId: "ALL" });
  };
  const focus = report.rows.find((row) => row.stationId === filters.stationId) ?? null;
  const lineCode = lines.find((line) => line.id === filters.lineId)?.code;

  return {
    lines,
    stations,
    scopeStations,
    filters,
    setFilters: changeFilters,
    /** Bấm lại ga đang xem thì bỏ chọn. */
    toggleStation: (stationId: string) =>
      changeFilters({
        ...filters,
        stationId: filters.stationId === stationId ? "ALL" : stationId,
      }),
    metric,
    setMetric,
    report,
    rows,
    focus,
    scopeName: focus ? `Ga ${focus.name}` : (lineCode ?? "Toàn mạng lưới"),
    exportOpen,
    setExportOpen,
    canExport: can("revenue.export"),
    canSeeHourly: can("stats.hourlyFlow"),
  };
}
