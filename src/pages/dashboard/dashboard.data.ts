import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { apiErrorMessage, parkingLotsApi, reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTrainsData } from "@/lib/operations.queries";
import { todayIso, useSyncedQuery } from "@/lib/query-sync";
import { parkingKeys, toParkingLot } from "@/lib/catalogs";
import { parkingLotsStore } from "@/stores/admin";
import { useAnnouncementsData } from "@/pages/notifications/notifications.service";
import { REPORTS_KEY } from "@/pages/reports/reports.service";

/** Doanh thu và lượt qua cổng hôm nay, doanh thu theo ngày của 7 ngày gần nhất. */
export function useTodayReports() {
  const { hasPermission } = useAuth();
  const canRevenue = hasPermission("REPORT_VIEW");
  const canTraffic = hasPermission("REPORT_TRAFFIC_VIEW");
  const today = todayIso();
  const weekStart = todayIso(subDays(new Date(), 6));
  const revenueToday = useQuery({
    queryKey: [...REPORTS_KEY, "revenue", "SERVICE", today, today],
    queryFn: () => reportsApi.revenue({ from: today, to: today, groupBy: "SERVICE" }),
    enabled: canRevenue,
    retry: false,
  });
  const trafficToday = useQuery({
    queryKey: [...REPORTS_KEY, "traffic", "STATION", today, today],
    queryFn: () => reportsApi.traffic({ from: today, to: today, groupBy: "STATION" }),
    enabled: canTraffic,
    retry: false,
  });
  const week = useQuery({
    queryKey: [...REPORTS_KEY, "revenue", "DAY", weekStart, today],
    queryFn: () => reportsApi.revenue({ from: weekStart, to: today, groupBy: "DAY" }),
    enabled: canRevenue,
    retry: false,
  });
  const text = <T>(
    q: { data?: T; isPending: boolean; error: unknown },
    show: (d: T) => string,
    allowed: boolean,
  ) => (!allowed ? "—" : q.data ? show(q.data) : q.error ? "Lỗi tải" : "…");
  return {
    canRevenue,
    revenueText: text(revenueToday, (r) => shortVnd(r.totalAmountVnd ?? 0), canRevenue),
    paymentsText: text(revenueToday, (r) => r.totalCount.toLocaleString("vi-VN"), canRevenue),
    trafficText: text(trafficToday, (r) => r.totalCount.toLocaleString("vi-VN"), canTraffic),
    week: week.data?.rows ?? [],
    weekError: week.error ? apiErrorMessage(week.error) : "",
    weekLoading: canRevenue && week.isPending,
  };
}

/** Số tiền rút gọn cho dải số liệu. */
export function shortVnd(value: number) {
  const format = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (value >= 1e9) return `${format(value / 1e9)} tỷ VND`;
  if (value >= 1e6) return `${format(value / 1e6)} triệu VND`;
  return `${value.toLocaleString("vi-VN")} VND`;
}

/** Nguồn dữ liệu chung của trang tổng quan Admin. */
export function useAdminDashboardData() {
  const { hasPermission } = useAuth();
  useTrainsData();
  useAnnouncementsData(
    hasPermission("ANNOUNCEMENT_MANAGE") || hasPermission("ANNOUNCEMENT_APPROVE"),
  );
  useSyncedQuery({
    queryKey: parkingKeys.lots,
    queryFn: () => parkingLotsApi.list(),
    store: parkingLotsStore,
    map: (lots) => lots.map(toParkingLot),
  });
}
