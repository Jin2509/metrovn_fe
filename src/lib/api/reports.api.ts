import { apiRequest } from "./client";
import { V1 } from "./path";
import type { Report, ReportFormat, ReportQuery, RevenueGroup, TrafficGroup } from "./types";

// Mỗi lần xem/xuất được ghi vào nhật ký thao tác.
const R = `${V1}/reports`;

export const reportsApi = {
  /** Cần REPORT_VIEW. `groupBy` mặc định DAY. */
  revenue: (query: ReportQuery<RevenueGroup>) => apiRequest<Report>(`${R}/revenue`, { query }),
  /** Cần REPORT_TRAFFIC_VIEW. `groupBy` mặc định STATION. */
  traffic: (query: ReportQuery<TrafficGroup>) => apiRequest<Report>(`${R}/traffic`, { query }),
  /** Cần REPORT_EXPORT. Trả file Excel hoặc PDF. */
  exportRevenue: (query: ReportQuery<RevenueGroup> & { format?: ReportFormat }) =>
    apiRequest<Blob>(`${R}/revenue/export`, { query, responseType: "blob" }),
  /** Cần REPORT_EXPORT và REPORT_TRAFFIC_VIEW. */
  exportTraffic: (query: ReportQuery<TrafficGroup> & { format?: ReportFormat }) =>
    apiRequest<Blob>(`${R}/traffic/export`, { query, responseType: "blob" }),
};
