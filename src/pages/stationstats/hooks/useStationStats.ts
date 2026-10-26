import { useDeferredValue, useMemo, useState } from "react";
import { lines, stations } from "@/mocks/metro";
import { stationDailyStats } from "@/mocks/station-stats";
import { DEFAULT_STATION_STATS_FILTERS } from "@/pages/stationstats/stationstats.constants";
import {
  calculateStationStats,
  selectStationRows,
} from "@/pages/stationstats/stationstats.service";
import type {
  StationStatsFilters,
  StationStatsMetric,
} from "@/pages/stationstats/stationstats.types";

export function useStationStats() {
  const [filters, setFilters] = useState<StationStatsFilters>(DEFAULT_STATION_STATS_FILTERS);
  const [metric, setMetric] = useState<StationStatsMetric>("revenue");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  // Chỉ tổng hợp lại khi bộ lọc dữ liệu đổi; đổi tiêu chí/tìm kiếm chỉ sắp xếp lại kết quả có sẵn.
  const report = useMemo(
    () => calculateStationStats(stationDailyStats, stations, filters),
    [filters],
  );
  const rows = useMemo(
    () => selectStationRows(report.rows, metric, deferredQuery),
    [report.rows, metric, deferredQuery],
  );
  const focusStation = report.rows.find((row) => row.stationId === filters.focusStationId);

  const changeFilters = (next: StationStatsFilters) => {
    // Ga đang xem không còn thuộc tuyến đã chọn → quay về toàn mạng lưới.
    const focusInScope =
      next.focusStationId === "ALL" ||
      next.lineId === "ALL" ||
      stations.some((s) => s.id === next.focusStationId && s.lineIds.includes(next.lineId));
    setFilters(focusInScope ? next : { ...next, focusStationId: "ALL" });
  };

  return {
    lines,
    filters,
    setFilters: changeFilters,
    focusStation: (stationId: string) => changeFilters({ ...filters, focusStationId: stationId }),
    metric,
    setMetric,
    query,
    setQuery,
    report,
    rows,
    focusStationName: focusStation?.name ?? null,
  };
}
