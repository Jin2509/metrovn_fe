import { STATION_STATS_RANGE } from "@/mocks/station-stats";
import type {
  StationStatsFilters,
  StationStatsMetric,
} from "@/pages/stationstats/stationstats.types";

export const DEFAULT_STATION_STATS_FILTERS: StationStatsFilters = {
  from: "2026-10-01",
  to: STATION_STATS_RANGE.to,
  lineId: "ALL",
  focusStationId: "ALL",
};

export const STATION_STATS_METRICS: { value: StationStatsMetric; label: string }[] = [
  { value: "revenue", label: "Doanh thu" },
  { value: "flow", label: "Lưu lượng hành khách" },
];

/** Số ga hiển thị trên biểu đồ xếp hạng — mạng lưới lớn vẫn đọc được, danh sách đầy đủ nằm ở bảng. */
export const STATION_STATS_TOP_N = 10;
