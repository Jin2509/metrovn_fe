import { describe, expect, it } from "vitest";
import type { Station } from "@/mocks/metro";
import type { StationDailyStat } from "@/mocks/station-stats";
import {
  buildReportExport,
  calculateReport,
  hourlyProfile,
  reportToHtml,
  shortMoney,
  sortRows,
} from "@/pages/reports/reports.service";

const station = (
  id: string,
  lineIds: string[],
  dailyFlow = 0,
  status: Station["status"] = "ACTIVE",
) =>
  ({
    id,
    name: `Ga ${id}`,
    code: id,
    address: "",
    district: "",
    lineIds,
    lat: 0,
    lng: 0,
    order: 1,
    interchange: lineIds.length > 1,
    status,
    dailyFlow,
  }) satisfies Station;

const stations = [
  station("A", ["L1", "L2"], 300),
  station("B", ["L1"], 100),
  station("D", ["L2"], 100),
  station("C", ["L2"], 999, "INACTIVE"),
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
    transactions: 10,
  }) satisfies StationDailyStat;

const records = [
  record("2026-10-01", "A", 100, 50_000),
  record("2026-10-02", "A", 300, 70_000),
  record("2026-10-01", "B", 500, 10_000),
  record("2026-10-03", "B", 900, 90_000), // ngoài khoảng lọc
  record("2026-10-01", "C", 999, 999_999), // ga ngừng hoạt động
];

const filters = { from: "2026-10-01", to: "2026-10-02", lineId: "L1", stationId: "ALL" };

describe("calculateReport", () => {
  it("cộng dồn theo ga, bỏ bản ghi ngoài khoảng và ga ngừng hoạt động", () => {
    const { rows, totals } = calculateReport(records, stations, filters);
    const a = rows.find((row) => row.stationId === "A")!;
    expect(rows.map((row) => row.stationId)).toEqual(["A", "B"]);
    expect(a).toMatchObject({
      flow: 800,
      revenue: 122_000,
      netRevenue: 121_800,
      avgDailyFlow: 400,
      transactions: 20,
    });
    expect(totals).toMatchObject({
      stationCount: 2,
      days: 2,
      flow: 1800,
      revenue: 133_000,
      transactions: 30,
    });
  });

  it("tổng toàn phạm vi luôn bằng tổng các dòng theo ga, không lệch giữa các khối", () => {
    const { rows, totals, trend } = calculateReport(records, stations, filters);
    const sum = (pick: (row: (typeof rows)[number]) => number) =>
      rows.reduce((total, row) => total + pick(row), 0);
    expect(totals.revenue).toBe(sum((row) => row.revenue));
    expect(totals.flow).toBe(sum((row) => row.flow));
    expect(trend.reduce((total, p) => total + p.ticketRevenue + p.parkingRevenue, 0)).toBe(
      totals.revenue,
    );
    expect(trend.reduce((total, p) => total + p.flow, 0)).toBe(totals.flow);
  });

  it("chọn ga: tổng và xu hướng theo ga đó, bảng vẫn đủ ga để so sánh", () => {
    const report = calculateReport(records, stations, { ...filters, stationId: "B" });
    expect(report.rows).toHaveLength(2);
    expect(report.totals).toMatchObject({ stationCount: 1, flow: 1000, revenue: 11_000 });
    expect(report.trend).toEqual([
      {
        date: "2026-10-01",
        day: "01/10",
        ticketRevenue: 10_000,
        parkingRevenue: 1000,
        flow: 1000,
      },
    ]);
  });

  it("xếp hạng riêng theo doanh thu và lưu lượng", () => {
    const { rows } = calculateReport(records, stations, filters);
    const [a, b] = rows;
    expect([a.revenueRank, b.revenueRank]).toEqual([1, 2]);
    expect([a.flowRank, b.flowRank]).toEqual([2, 1]);
    expect(sortRows(rows, "flow").map((row) => row.stationId)).toEqual(["B", "A"]);
  });

  it("khoảng thời gian ngược hoặc bỏ trống là không hợp lệ", () => {
    for (const range of [{ from: "2026-10-05" }, { from: "" }, { to: "" }]) {
      const report = calculateReport(records, stations, { ...filters, ...range });
      expect(report.invalid, JSON.stringify(range)).toBe(true);
      expect(report.rows).toEqual([]);
    }
  });
});

describe("shortMoney", () => {
  it("rút gọn số lớn để không bị cắt trên thẻ chỉ số", () => {
    expect(shortMoney(16_144_244_575)).toBe("16,14 tỷ VND");
    expect(shortMoney(1_687_780_253)).toBe("1,69 tỷ VND");
    expect(shortMoney(2_500_000)).toBe("2,5 triệu VND");
    expect(shortMoney(7000)).toBe("7.000 VND");
  });
});

describe("hourlyProfile", () => {
  const network = [{ hour: "7h", luot: 1000 }];
  const lineAll = { lineId: "ALL", stationId: "ALL" };

  it("toàn mạng giữ nguyên, từng ga chia theo tỉ trọng lượt khách", () => {
    expect(hourlyProfile(network, stations, lineAll)[0].luot).toBe(1000);
    expect(hourlyProfile(network, stations, { ...lineAll, stationId: "B" })[0].luot).toBe(200);
  });

  it("lọc theo tuyến chỉ tính ga của tuyến đó", () => {
    expect(hourlyProfile(network, stations, { ...lineAll, lineId: "L2" })[0].luot).toBe(800);
  });
});

describe("mẫu báo cáo", () => {
  const { rows, totals } = calculateReport(records, stations, filters);
  const file = buildReportExport(
    rows,
    totals,
    filters,
    "Tuyến 1",
    "Kế toán A",
    new Date("2026-11-04"),
  );

  it("có kỳ báo cáo, phạm vi, người lập, thời điểm xuất và số tổng", () => {
    const labels = file.meta.map(([label]) => label);
    expect(labels).toEqual(["Kỳ báo cáo", "Phạm vi", "Người lập", "Thời điểm xuất"]);
    expect(file.meta[0][1]).toBe("01/10/2026 – 02/10/2026");
    expect(file.kpis.map(([label]) => label)).toContain("Doanh thu thuần");
    expect(file.rows).toHaveLength(2);
    expect(file.fileName).toBe("HopOn_BaoCaoThongKe_2026-10-01_2026-10-02");
  });

  it("dòng tổng khớp số tổng và cộng đúng từng cột", () => {
    expect(file.totals[0]).toBe("Tổng cộng");
    expect(file.totals[4]).toBe(totals.netRevenue);
    expect(file.totals[5]).toBe(totals.transactions);
    expect(file.totals[6]).toBe(totals.entries);
  });

  it("đang xem một ga thì chỉ xuất ga đó, dòng tổng theo ga đó", () => {
    const one = { ...filters, stationId: "B" };
    const report = calculateReport(records, stations, one);
    const single = buildReportExport(report.rows, report.totals, one, "Ga B", "A");
    expect(single.rows.map((row) => row[0])).toEqual(["Ga B"]);
    expect(single.totals[6]).toBe(500);
  });

  it("bản in đủ khối của mẫu và thoát ký tự HTML", () => {
    const html = reportToHtml({ ...file, rows: [["<img src=x>", 1]] }, "/favicon.svg");
    expect(html).not.toContain("<img src=x>");
    expect(html).toContain("&lt;img");
    for (const part of ["BÁO CÁO THỐNG KÊ", "Kỳ báo cáo", "Tổng cộng", "Người phê duyệt", "@page"])
      expect(html).toContain(part);
  });
});
