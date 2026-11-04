export type ReportMetric = "revenue" | "flow";

export type ReportFilters = {
  from: string;
  to: string;
  lineId: string;
  /** Ga đang xem ("ALL" = toàn bộ ga trong phạm vi lọc). */
  stationId: string;
};

export type StationReportRow = {
  stationId: string;
  name: string;
  interchange: boolean;
  entries: number;
  exits: number;
  flow: number;
  ticketRevenue: number;
  parkingRevenue: number;
  refund: number;
  revenue: number;
  netRevenue: number;
  transactions: number;
  avgDailyFlow: number;
  revenueRank: number;
  flowRank: number;
};

export type ReportTotals = Pick<
  StationReportRow,
  | "entries"
  | "exits"
  | "flow"
  | "ticketRevenue"
  | "parkingRevenue"
  | "refund"
  | "revenue"
  | "netRevenue"
  | "transactions"
> & { days: number; stationCount: number };

export type ReportTrendPoint = {
  date: string;
  day: string;
  ticketRevenue: number;
  parkingRevenue: number;
  flow: number;
};

export type HourlyPoint = { hour: string; luot: number };

export type ReportExport = {
  title: string;
  /** Tên tệp không gồm phần mở rộng. */
  fileName: string;
  /** Tiêu chí lọc và thông tin lập báo cáo. */
  meta: [string, string][];
  /** Số liệu tổng hợp nổi bật ở đầu báo cáo. */
  kpis: [string, string][];
  headers: string[];
  /** Cột đầu là chữ, các cột sau là số. */
  rows: (string | number)[][];
  /** Dòng tổng cuối bảng. */
  totals: (string | number)[];
  note: string;
};
