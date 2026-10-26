import type { Station } from "@/mocks/metro";
import type { StationDailyStat } from "@/mocks/station-stats";
import type {
  StationStatRow,
  StationStatsFilters,
  StationStatsMetric,
  StationStatsReport,
  StationTrendPoint,
} from "@/pages/stationstats/stationstats.types";

type Accumulator = Pick<
  StationStatRow,
  "entries" | "exits" | "ticketRevenue" | "parkingRevenue" | "refund"
>;

const emptyAccumulator = (): Accumulator => ({
  entries: 0,
  exits: 0,
  ticketRevenue: 0,
  parkingRevenue: 0,
  refund: 0,
});

export const metricValue = (row: StationStatRow, metric: StationStatsMetric) =>
  metric === "revenue" ? row.revenue : row.flow;

/**
 * Tổng hợp thống kê theo ga trong MỘT lượt duyệt bản ghi (O(số bản ghi)) — dùng Map tra cứu theo
 * mã ga thay vì filter lồng nhau, nên chi phí tăng tuyến tính khi mạng lưới thêm ga/chi nhánh.
 */
export function calculateStationStats(
  records: StationDailyStat[],
  stations: Station[],
  filters: StationStatsFilters,
): StationStatsReport {
  const invalid = filters.from > filters.to;
  const scope = stations.filter(
    (station) =>
      station.status === "ACTIVE" &&
      (filters.lineId === "ALL" || station.lineIds.includes(filters.lineId)),
  );
  const byStation = new Map<string, Accumulator>(
    invalid ? [] : scope.map((station) => [station.id, emptyAccumulator()]),
  );
  const byDay = new Map<string, StationTrendPoint>();
  const days = new Set<string>();

  for (const record of records) {
    if (record.date < filters.from || record.date > filters.to) continue;
    const accumulator = byStation.get(record.stationId);
    if (!accumulator) continue;
    accumulator.entries += record.entries;
    accumulator.exits += record.exits;
    accumulator.ticketRevenue += record.ticketRevenue;
    accumulator.parkingRevenue += record.parkingRevenue;
    accumulator.refund += record.refund;
    days.add(record.date);

    if (filters.focusStationId !== "ALL" && record.stationId !== filters.focusStationId) continue;
    let point = byDay.get(record.date);
    if (!point) {
      point = {
        date: record.date,
        day: `${record.date.slice(8, 10)}/${record.date.slice(5, 7)}`,
        revenue: 0,
        flow: 0,
      };
      byDay.set(record.date, point);
    }
    point.revenue += record.ticketRevenue + record.parkingRevenue;
    point.flow += record.entries + record.exits;
  }

  const dayCount = days.size;
  const rows: StationStatRow[] = scope
    .filter((station) => byStation.has(station.id))
    .map((station) => {
      const accumulator = byStation.get(station.id)!;
      const revenue = accumulator.ticketRevenue + accumulator.parkingRevenue;
      const flow = accumulator.entries + accumulator.exits;
      return {
        stationId: station.id,
        name: station.name,
        lineIds: station.lineIds,
        interchange: station.interchange,
        ...accumulator,
        flow,
        revenue,
        netRevenue: revenue - accumulator.refund,
        avgDailyFlow: dayCount ? Math.round(flow / dayCount) : 0,
        revenuePerEntry: accumulator.entries ? Math.round(revenue / accumulator.entries) : 0,
        revenueRank: 0,
        flowRank: 0,
      };
    });

  assignRanks(rows, "revenue");
  assignRanks(rows, "flow");

  const totals = rows.reduce(
    (sum, row) => ({
      ...sum,
      revenue: sum.revenue + row.revenue,
      netRevenue: sum.netRevenue + row.netRevenue,
      refund: sum.refund + row.refund,
      flow: sum.flow + row.flow,
      entries: sum.entries + row.entries,
      exits: sum.exits + row.exits,
    }),
    {
      revenue: 0,
      netRevenue: 0,
      refund: 0,
      flow: 0,
      entries: 0,
      exits: 0,
      stationCount: rows.length,
      days: dayCount,
    },
  );
  const trend = [...byDay.values()].sort((first, second) => first.date.localeCompare(second.date));

  return { invalid, rows, totals, trend };
}

function assignRanks(rows: StationStatRow[], metric: StationStatsMetric) {
  const key = metric === "revenue" ? "revenueRank" : "flowRank";
  [...rows]
    .sort((first, second) => metricValue(second, metric) - metricValue(first, metric))
    .forEach((row, index) => (row[key] = index + 1));
}

/** Lọc theo tên + sắp xếp theo tiêu chí — tách khỏi bước tổng hợp để gõ tìm kiếm không phải cộng dồn lại. */
export function selectStationRows(
  rows: StationStatRow[],
  metric: StationStatsMetric,
  query: string,
): StationStatRow[] {
  const keyword = query.trim().toLowerCase();
  return rows
    .filter((row) => !keyword || row.name.toLowerCase().includes(keyword))
    .sort((first, second) => metricValue(second, metric) - metricValue(first, metric));
}
