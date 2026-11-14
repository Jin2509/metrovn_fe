import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { paymentsApi, reportsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSyncedQuery } from "@/lib/query-sync";
import { closedMonthsStore, periodsStore } from "@/stores/admin";
import {
  closeAccountingPeriod,
  periodRange,
  toPeriods,
} from "@/pages/periodclosing/periodclosing.service";
import { REPORTS_KEY } from "@/pages/reports/reports.service";
import { REFUNDS_KEY } from "@/pages/transactions/transactions.service";

export function usePeriodClosing() {
  const { hasPermission } = useAuth();
  const range = periodRange();
  const closed = closedMonthsStore.use();
  const data = useSyncedQuery({
    queryKey: [...REPORTS_KEY, "revenue", "MONTH", range.from, range.to],
    queryFn: () => reportsApi.revenue({ ...range, groupBy: "MONTH" }),
    store: periodsStore,
    map: (report) => toPeriods(report, closedMonthsStore.get()),
    enabled: hasPermission("REPORT_VIEW"),
  });
  const refunds = useQuery({
    queryKey: REFUNDS_KEY,
    queryFn: () => paymentsApi.byStatus({ status: "REFUND_PENDING", size: 50 }),
    enabled: hasPermission("PAYMENT_MANAGE"),
    retry: false,
  });
  const periods = periodsStore.use().map((p) => ({ ...p, closed: closed.includes(p.month) }));
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const confirmClose = () => {
    closeAccountingPeriod(selectedMonth);
    toast.success(`Đã chốt kỳ ${selectedMonth}`);
  };

  return {
    ...data,
    periods,
    pendingRefundCount: refunds.data?.page.totalElements ?? 0,
    selectedMonth,
    selectMonth: setSelectedMonth,
    closeDialog: () => setSelectedMonth(null),
    confirmClose,
  };
}
