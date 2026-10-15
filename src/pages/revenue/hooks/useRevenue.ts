import { useState } from "react";
import { roleStore, txnStore } from "@/mocks/admin";
import { DEFAULT_REVENUE_FILTERS } from "@/pages/revenue/revenue.constants";
import { calculateRevenueReport } from "@/pages/revenue/revenue.service";
import type { RevenueFilters } from "@/pages/revenue/revenue.types";

export function useRevenue() {
  const role = roleStore.use();
  const transactions = txnStore.use();
  const [filters, setFilters] = useState<RevenueFilters>(DEFAULT_REVENUE_FILTERS);
  const [exportOpen, setExportOpen] = useState(false);
  const report = calculateRevenueReport(transactions, filters);

  return {
    filters,
    setFilters,
    exportOpen,
    setExportOpen,
    report,
    readonly: role === "MANAGER",
  };
}
