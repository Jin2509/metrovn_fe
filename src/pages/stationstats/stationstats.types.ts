export type StationStatsMetric = "revenue" | "flow";

export type StationStatsFilters = {
  from: string;
  to: string;
  lineId: string;
  /** Ga đang xem xu hướng theo ngày ("ALL" = toàn mạng lưới trong phạm vi lọc). */
  focusStationId: string;
};

export type StationStatRow = {
  stationId: string;
  name: string;
  lineIds: string[];
  interchange: boolean;
  entries: number;
  exits: number;
  flow: number;
  ticketRevenue: number;
  parkingRevenue: number;
  refund: number;
  revenue: number;
  netRevenue: number;
  avgDailyFlow: number;
  /** Doanh thu bình quân trên mỗi lượt vào cổng. */
  revenuePerEntry: number;
  revenueRank: number;
  flowRank: number;
};

export type StationStatsTotals = {
  revenue: number;
  netRevenue: number;
  refund: number;
  flow: number;
  entries: number;
  exits: number;
  stationCount: number;
  days: number;
};

export type StationTrendPoint = {
  date: string;
  day: string;
  revenue: number;
  flow: number;
};

export type StationStatsReport = {
  invalid: boolean;
  rows: StationStatRow[];
  totals: StationStatsTotals;
  trend: StationTrendPoint[];
};
