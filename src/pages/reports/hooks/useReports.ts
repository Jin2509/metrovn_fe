import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import {
  apiErrorMessage,
  reportsApi,
  type ReportFormat,
  type RevenueGroup,
  type TrafficGroup,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { todayIso } from "@/lib/query-sync";
import {
  REPORTS_KEY,
  downloadBlob,
  exportFileName,
  invalidRange,
} from "@/pages/reports/reports.service";

export const REPORT_VIEW = "REPORT_VIEW";
export const REPORT_TRAFFIC_VIEW = "REPORT_TRAFFIC_VIEW";
export const REPORT_EXPORT = "REPORT_EXPORT";

export type RevenueTrend = Extract<RevenueGroup, "DAY" | "MONTH">;
export type RevenueBreakdown = Extract<RevenueGroup, "SERVICE" | "PRODUCT">;

export function useReports() {
  const { hasPermission } = useAuth();
  const canRevenue = hasPermission(REPORT_VIEW);
  const canTraffic = hasPermission(REPORT_TRAFFIC_VIEW);
  const canExport = hasPermission(REPORT_EXPORT);
  const [from, setFrom] = useState(() => todayIso(subDays(new Date(), 29)));
  const [to, setTo] = useState(() => todayIso());
  const [trend, setTrend] = useState<RevenueTrend>("DAY");
  const [breakdown, setBreakdown] = useState<RevenueBreakdown>("SERVICE");
  const [traffic, setTraffic] = useState<TrafficGroup>("STATION");
  const [exporting, setExporting] = useState("");
  const invalid = invalidRange(from, to);
  const range = { from, to };

  const options = (
    kind: "revenue" | "traffic",
    groupBy: string,
    enabled: boolean,
    fetch: () => ReturnType<typeof reportsApi.revenue>,
  ) => ({
    queryKey: [...REPORTS_KEY, kind, groupBy, from, to],
    queryFn: fetch,
    enabled: enabled && !invalid,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const trendQuery = useQuery(
    options("revenue", trend, canRevenue, () => reportsApi.revenue({ ...range, groupBy: trend })),
  );
  const breakdownQuery = useQuery(
    options("revenue", breakdown, canRevenue, () =>
      reportsApi.revenue({ ...range, groupBy: breakdown }),
    ),
  );
  const trafficQuery = useQuery(
    options("traffic", traffic, canTraffic, () =>
      reportsApi.traffic({ ...range, groupBy: traffic }),
    ),
  );

  const exportReport = async (kind: "revenue" | "traffic", format: ReportFormat) => {
    if (exporting || invalid) return;
    setExporting(`${kind}-${format}`);
    try {
      const blob =
        kind === "revenue"
          ? await reportsApi.exportRevenue({ ...range, groupBy: trend, format })
          : await reportsApi.exportTraffic({ ...range, groupBy: traffic, format });
      downloadBlob(
        blob,
        exportFileName(kind === "revenue" ? "DoanhThu" : "LuuLuong", from, to, format),
      );
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setExporting("");
    }
  };

  const state = (q: typeof trendQuery) => ({
    data: q.data,
    loading: q.isPending && q.fetchStatus !== "idle",
    error: q.error ? apiErrorMessage(q.error) : "",
    retry: () => void q.refetch(),
  });

  return {
    canRevenue,
    canTraffic,
    canExport,
    from,
    setFrom,
    to,
    setTo,
    invalid,
    trend,
    setTrend,
    breakdown,
    setBreakdown,
    traffic,
    setTraffic,
    trendReport: state(trendQuery),
    breakdownReport: state(breakdownQuery),
    trafficReport: state(trafficQuery),
    exporting,
    exportReport,
  };
}
