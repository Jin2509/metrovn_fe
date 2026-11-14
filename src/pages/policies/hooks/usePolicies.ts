import { useQuery } from "@tanstack/react-query";
import { greenJourneyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { parkingPriceCatalog, ticketTypeCatalog } from "@/lib/catalogs";
import { useOperationConfigsData } from "@/lib/operations.queries";
import { useSyncedQuery } from "@/lib/query-sync";
import { approvalsStore, parkingPricesStore, ticketTypesStore } from "@/stores/admin";
import { linesStore } from "@/stores/metro";
import { operationConfigsStore } from "@/stores/operations";
import { useApprovalsData } from "@/pages/approvals/approvals.service";
import { greenKeys } from "@/pages/green/green.service";

/** Chính sách đang áp dụng (chỉ xem), lấy từ backend. */
export function usePolicies() {
  const { hasPermission } = useAuth();
  useSyncedQuery({
    queryKey: ticketTypeCatalog.query.key,
    queryFn: ticketTypeCatalog.query.fn,
    store: ticketTypesStore,
    map: ticketTypeCatalog.query.map,
  });
  useSyncedQuery({
    queryKey: parkingPriceCatalog.query.key,
    queryFn: parkingPriceCatalog.query.fn,
    store: parkingPricesStore,
    map: parkingPriceCatalog.query.map,
  });
  useOperationConfigsData();
  useApprovalsData();
  const green = useQuery({
    queryKey: greenKeys.settings,
    queryFn: greenJourneyApi.settings,
    enabled: hasPermission("GREEN_JOURNEY_MANAGE") || hasPermission("REPORT_VIEW"),
    retry: false,
  });
  const lines = linesStore.use();
  const configs = operationConfigsStore.use();
  const activeByLine = lines.map((line) => ({
    line,
    config: configs.find((c) => c.lineId === line.id && c.status === "ACTIVE"),
  }));

  return {
    ticketTypes: ticketTypesStore.use().filter((t) => t.status === "ACTIVE"),
    parkingPrices: parkingPricesStore.use(),
    green: green.data,
    activeByLine,
    history: approvalsStore.use().filter((approval) => approval.status !== "PENDING"),
  };
}
