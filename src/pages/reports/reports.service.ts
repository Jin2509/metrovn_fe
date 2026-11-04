import type { Station } from "@/mocks/metro";
import type { StationDailyStat } from "@/mocks/station-stats";
import type {
  HourlyPoint,
  ReportExport,
  ReportFilters,
  ReportMetric,
  ReportTotals,
  ReportTrendPoint,
  StationReportRow,
} from "@/pages/reports/reports.types";

// Một nguồn số liệu duy nhất cho mọi con số trên trang: bảng đã tổng hợp theo NGÀY × GA.
// Giao dịch thô không có mã ga nên không dùng ở đây, tránh hai "tổng doanh thu" lệch nhau.

type Sums = Pick<
  ReportTotals,
  "entries" | "exits" | "ticketRevenue" | "parkingRevenue" | "refund" | "transactions"
>;

const emptySums = (): Sums => ({
  entries: 0,
  exits: 0,
  ticketRevenue: 0,
  parkingRevenue: 0,
  refund: 0,
  transactions: 0,
});

/** Các chỉ số suy ra từ số cộng dồn, dùng chung cho từng ga và tổng để không thể tính lệch nhau. */
const derive = (sums: Sums) => {
  const revenue = sums.ticketRevenue + sums.parkingRevenue;
  return {
    ...sums,
    revenue,
    netRevenue: revenue - sums.refund,
    flow: sums.entries + sums.exits,
  };
};

export const metricValue = (row: StationReportRow, metric: ReportMetric) =>
  metric === "revenue" ? row.revenue : row.flow;

const rankKey = { revenue: "revenueRank", flow: "flowRank" } as const;

export const rankOf = (row: StationReportRow, metric: ReportMetric) => row[rankKey[metric]];

function assignRanks(rows: StationReportRow[], metric: ReportMetric) {
  [...rows]
    .sort((a, b) => metricValue(b, metric) - metricValue(a, metric))
    .forEach((row, index) => (row[rankKey[metric]] = index + 1));
}

/** Ga thuộc phạm vi lọc theo tuyến; chỉ ga đang hoạt động mới có số liệu. */
export const stationsInScope = (stations: Station[], lineId: string) =>
  stations.filter(
    (station) =>
      station.status === "ACTIVE" && (lineId === "ALL" || station.lineIds.includes(lineId)),
  );

/**
 * Tổng hợp trong MỘT lượt duyệt bản ghi, nên chi phí tăng tuyến tính theo số ga × số ngày.
 * - `rows`: luôn đủ mọi ga trong phạm vi, để so sánh và xếp hạng.
 * - `totals`, `trend`: theo ga đang xem, hoặc toàn phạm vi nếu chưa chọn ga.
 */
export function calculateReport(
  records: StationDailyStat[],
  stations: Station[],
  filters: ReportFilters,
) {
  const invalid = !filters.from || !filters.to || filters.from > filters.to;
  const scope = invalid ? [] : stationsInScope(stations, filters.lineId);
  const byStation = new Map(scope.map((station) => [station.id, emptySums()]));
  const byDay = new Map<string, ReportTrendPoint>();
  const days = new Set<string>();
  const inFocus = (id: string) => filters.stationId === "ALL" || filters.stationId === id;

  for (const record of records) {
    if (record.date < filters.from || record.date > filters.to) continue;
    const sums = byStation.get(record.stationId);
    if (!sums) continue;
    sums.entries += record.entries;
    sums.exits += record.exits;
    sums.ticketRevenue += record.ticketRevenue;
    sums.parkingRevenue += record.parkingRevenue;
    sums.refund += record.refund;
    sums.transactions += record.transactions;
    days.add(record.date);

    if (!inFocus(record.stationId)) continue;
    let point = byDay.get(record.date);
    if (!point) {
      point = {
        date: record.date,
        day: `${record.date.slice(8, 10)}/${record.date.slice(5, 7)}`,
        ticketRevenue: 0,
        parkingRevenue: 0,
        flow: 0,
      };
      byDay.set(record.date, point);
    }
    point.ticketRevenue += record.ticketRevenue;
    point.parkingRevenue += record.parkingRevenue;
    point.flow += record.entries + record.exits;
  }

  const rows: StationReportRow[] = scope.map((station) => {
    const stats = derive(byStation.get(station.id)!);
    return {
      stationId: station.id,
      name: station.name,
      interchange: station.interchange,
      ...stats,
      avgDailyFlow: days.size ? Math.round(stats.flow / days.size) : 0,
      revenueRank: 0,
      flowRank: 0,
    };
  });
  assignRanks(rows, "revenue");
  assignRanks(rows, "flow");

  const focused = rows.filter((row) => inFocus(row.stationId));
  const sums = focused.reduce((total, row) => {
    for (const key of Object.keys(total) as (keyof Sums)[]) total[key] += row[key];
    return total;
  }, emptySums());
  const totals: ReportTotals = { ...derive(sums), days: days.size, stationCount: focused.length };
  const trend = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));

  return { invalid, rows, totals, trend };
}

export const sortRows = (rows: StationReportRow[], metric: ReportMetric) =>
  [...rows].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));

/**
 * Lưu lượng theo giờ của một ngày điển hình. Hồ sơ giờ của toàn mạng được chia theo tỉ trọng
 * lượt khách của phạm vi đang xem, vì bảng ngày × ga không có chi tiết từng giờ.
 */
export function hourlyProfile(
  network: HourlyPoint[],
  stations: Station[],
  filters: Pick<ReportFilters, "lineId" | "stationId">,
): HourlyPoint[] {
  const active = stationsInScope(stations, "ALL");
  const scope =
    filters.stationId === "ALL"
      ? stationsInScope(stations, filters.lineId)
      : active.filter((station) => station.id === filters.stationId);
  const sum = (list: Station[]) => list.reduce((total, station) => total + station.dailyFlow, 0);
  const factor = sum(active) ? sum(scope) / sum(active) : 0;
  return network.map((point) => ({ ...point, luot: Math.round(point.luot * factor) }));
}

/** Số tiền rút gọn cho thẻ chỉ số, số đầy đủ nằm ở dòng phụ và trong bảng. */
export function shortMoney(value: number) {
  const format = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  if (value >= 1e9) return `${format(value / 1e9)} tỷ VND`;
  if (value >= 1e6) return `${format(value / 1e6)} triệu VND`;
  return `${value.toLocaleString("vi-VN")} VND`;
}

const vnd = (value: number) => `${value.toLocaleString("vi-VN")} VND`;
const count = (value: number) => value.toLocaleString("vi-VN");

const dmy = (value: string) => value.split("-").reverse().join("/");

/** Nội dung báo cáo (UC15-03): tiêu chí lọc, số liệu tổng hợp, bảng chi tiết, dòng tổng, thời điểm xuất. */
export function buildReportExport(
  rows: StationReportRow[],
  totals: ReportTotals,
  filters: ReportFilters,
  scopeName: string,
  exportedBy: string,
  now = new Date(),
): ReportExport {
  const shown = rows.filter(
    (row) => filters.stationId === "ALL" || row.stationId === filters.stationId,
  );
  const sum = (pick: (row: StationReportRow) => number) =>
    shown.reduce((total, row) => total + pick(row), 0);
  return {
    title: "BÁO CÁO THỐNG KÊ DOANH THU VÀ LƯU LƯỢNG",
    fileName: `HopOn_BaoCaoThongKe_${filters.from}_${filters.to}`,
    meta: [
      ["Kỳ báo cáo", `${dmy(filters.from)} – ${dmy(filters.to)}`],
      ["Phạm vi", scopeName],
      ["Người lập", exportedBy],
      ["Thời điểm xuất", now.toLocaleString("vi-VN")],
    ],
    kpis: [
      ["Doanh thu gộp", vnd(totals.revenue)],
      ["Hoàn tiền", vnd(totals.refund)],
      ["Doanh thu thuần", vnd(totals.netRevenue)],
      ["Số giao dịch", count(totals.transactions)],
      ["Tổng lưu lượng", `${count(totals.flow)} lượt`],
    ],
    headers: [
      "Ga",
      "Doanh thu vé (VND)",
      "Gửi xe (VND)",
      "Hoàn tiền (VND)",
      "Doanh thu thuần (VND)",
      "Số giao dịch",
      "Lượt vào",
      "Lượt ra",
      "TB lượt/ngày",
    ],
    rows: shown.map((row) => [
      row.name,
      row.ticketRevenue,
      row.parkingRevenue,
      row.refund,
      row.netRevenue,
      row.transactions,
      row.entries,
      row.exits,
      row.avgDailyFlow,
    ]),
    totals: [
      "Tổng cộng",
      sum((row) => row.ticketRevenue),
      sum((row) => row.parkingRevenue),
      sum((row) => row.refund),
      sum((row) => row.netRevenue),
      sum((row) => row.transactions),
      sum((row) => row.entries),
      sum((row) => row.exits),
      sum((row) => row.avgDailyFlow),
    ],
    note: "Số liệu tổng hợp theo ngày và ga, không chứa thông tin cá nhân hành khách.",
  };
}

const escapeHtml = (value: string | number) =>
  String(value).replace(
    /[&<>"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!,
  );

const cell = (value: string | number) =>
  typeof value === "number" ? value.toLocaleString("vi-VN") : value;

/** Mẫu bản in A4 ngang. Trình duyệt in hoặc lưu thành PDF, tiêu đề bảng lặp lại khi sang trang. */
export function reportToHtml(report: ReportExport, logoUrl: string) {
  const { title, meta, kpis, headers, rows, totals, note } = report;
  const tr = (list: (string | number)[], tag: string) =>
    `<tr>${list.map((value) => `<${tag}>${escapeHtml(cell(value))}</${tag}>`).join("")}</tr>`;
  const preparedBy = meta.find(([label]) => label === "Người lập")?.[1] ?? "";
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(report.fileName)}</title><style>
@page{size:A4 landscape;margin:11mm 12mm 13mm;@bottom-right{content:"Trang " counter(page) " / " counter(pages);font:9pt sans-serif;color:#576574}@bottom-left{content:"HopOn · Cổng quản trị";font:9pt sans-serif;color:#576574}}
*{box-sizing:border-box}body{margin:0;color:#101b2b;font:10pt "Be Vietnam Pro","Segoe UI",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
header{display:flex;align-items:center;gap:10px;border-bottom:2px solid #00767e;padding-bottom:8px}header img{width:38px;height:38px}header b{display:block;font-size:13pt}header span{color:#576574;font-size:9pt}
h1{margin:10px 0 8px;text-align:center;font-size:14pt;letter-spacing:.3px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;margin-bottom:12px}.meta b{display:inline-block;min-width:96px;color:#576574;font-weight:500}
.kpis{display:grid;grid-template-columns:repeat(${kpis.length},1fr);border:1px solid #d5dce3;border-radius:6px;margin-bottom:10px}.kpis div{padding:8px 10px;border-left:1px solid #d5dce3}.kpis div:first-child{border-left:0}.kpis small{display:block;color:#576574;font-size:8.5pt}.kpis b{font-size:11pt}
table{width:100%;border-collapse:collapse;font-size:9pt}thead{display:table-header-group}tr{break-inside:avoid}th{background:#00767e;color:#fff;padding:6px;text-align:right;font-weight:600}td{padding:3.5px 6px;text-align:right;border-bottom:1px solid #e2e7ec}th:first-child,td:first-child{text-align:left}tbody tr:nth-child(even){background:#f4f6f8}tfoot td{font-weight:700;background:#ddf1f2;border-top:2px solid #00767e}
.note{margin:6px 0 12px;color:#576574;font-size:8.5pt}.sign{display:grid;grid-template-columns:1fr 1fr;text-align:center;break-inside:avoid}.sign b{display:block}.sign i{display:block;color:#576574;font-size:8.5pt;margin-bottom:34px}
</style></head><body>
<header><img src="${escapeHtml(logoUrl)}" alt=""><div><b>HopOn</b><span>Cổng quản trị Metro TP.HCM</span></div></header>
<h1>${escapeHtml(title)}</h1>
<section class="meta">${meta.map(([label, value]) => `<div><b>${escapeHtml(label)}:</b> ${escapeHtml(value)}</div>`).join("")}</section>
<section class="kpis">${kpis.map(([label, value]) => `<div><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></div>`).join("")}</section>
<table><thead>${tr(headers, "th")}</thead><tbody>${rows.map((row) => tr(row, "td")).join("")}</tbody><tfoot>${tr(totals, "td")}</tfoot></table>
<p class="note">${escapeHtml(note)}</p>
<section class="sign"><div><b>Người lập báo cáo</b><i>(Ký, ghi rõ họ tên)</i>${escapeHtml(preparedBy)}</div><div><b>Người phê duyệt</b><i>(Ký, ghi rõ họ tên)</i></div></section>
</body></html>`;
}
