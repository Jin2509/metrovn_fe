import { describe, expect, it } from "vitest";
import type { Station } from "@/mocks/metro";
import type { StationDailyStat } from "@/mocks/station-stats";
import {
  calculateStationStats,
  selectStationRows,
} from "@/pages/stationstats/stationstats.service";

const station = (
  id: string,
  name: string,
  lineIds: string[],
  status: Station["status"] = "ACTIVE",
) =>
  ({
    id,
    name,
    code: id,
    address: "",
    district: "",
    lineIds,
    lat: 0,
    lng: 0,
    order: 1,
    interchange: lineIds.length > 1,
    status,
    dailyFlow: 0,
  }) satisfies Station;

const stations = [
  station("A", "Ga A", ["L1", "L2"]),
  station("B", "Ga B", ["L1"]),
  station("C", "Ga C", ["L2"], "INACTIVE"),
];

const record = (date: string, stationId: string, entries: number, ticketRevenue: number) =>
  ({
    date,
    stationId,
    entries,
    exits: entries,
    ticketRevenue,
    parkingRevenue: 1000,
    refund: 100,
  }) satisfies StationDailyStat;

const records = [
  record("2026-10-01", "A", 100, 50_000),
  record("2026-10-02", "A", 300, 70_000),
  record("2026-10-01", "B", 500, 10_000),
  record("2026-10-03", "B", 900, 90_000), // ngoài khoảng lọc
  record("2026-10-01", "C", 999, 999_999), // ga ngừng hoạt động
];

const filters = { from: "2026-10-01", to: "2026-10-02", lineId: "ALL", focusStationId: "ALL" };

describe("calculateStationStats", () => {
  it("cộng dồn đúng theo ga, bỏ bản ghi ngoài khoảng và ga ngừng hoạt động", () => {
    const { rows, totals } = calculateStationStats(records, stations, filters);
    const a = rows.find((row) => row.stationId === "A")!;
    expect(rows.map((row) => row.stationId)).toEqual(["A", "B"]);
    expect(a.flow).toBe(800);
    expect(a.revenue).toBe(122_000);
    expect(a.netRevenue).toBe(121_800);
    expect(a.avgDailyFlow).toBe(400);
    expect(totals).toMatchObject({ stationCount: 2, days: 2, flow: 1800, revenue: 133_000 });
  });

  it("xếp hạng riêng theo doanh thu và lưu lượng", () => {
    const { rows } = calculateStationStats(records, stations, filters);
    const [a, b] = rows;
    expect([a.revenueRank, b.revenueRank]).toEqual([1, 2]);
    expect([a.flowRank, b.flowRank]).toEqual([2, 1]);
  });

  it("lọc theo tuyến và chỉ dựng xu hướng cho ga đang xem", () => {
    const report = calculateStationStats(records, stations, {
      ...filters,
      lineId: "L1",
      focusStationId: "B",
    });
    expect(report.rows).toHaveLength(2);
    expect(report.trend).toEqual([
      { date: "2026-10-01", day: "01/10", revenue: 11_000, flow: 1000 },
    ]);
  });

  it("khoảng thời gian ngược trả về rỗng", () => {
    const report = calculateStationStats(records, stations, { ...filters, from: "2026-10-05" });
    expect(report.invalid).toBe(true);
    expect(report.rows).toEqual([]);
  });
});

describe("selectStationRows", () => {
  it("tìm theo tên và sắp xếp giảm dần theo tiêu chí", () => {
    const { rows } = calculateStationStats(records, stations, filters);
    expect(selectStationRows(rows, "flow", "").map((row) => row.stationId)).toEqual(["B", "A"]);
    expect(selectStationRows(rows, "revenue", "ga a").map((row) => row.stationId)).toEqual(["A"]);
  });
});
