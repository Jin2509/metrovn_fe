import type { RevenueFilters } from "@/pages/revenue/revenue.types";

export const DEFAULT_REVENUE_FILTERS: RevenueFilters = {
  from: "2026-10-01",
  to: "2026-10-14",
  service: "ALL",
  method: "ALL",
};

export const REVENUE_SERVICE_OPTIONS = [
  { value: "ALL", label: "Mọi dịch vụ" },
  { value: "Vé", label: "Vé" },
  { value: "Gửi xe", label: "Gửi xe" },
] as const;

export const REVENUE_METHOD_OPTIONS = [
  { value: "ALL", label: "Mọi phương thức" },
  { value: "Ví điện tử", label: "Ví điện tử" },
  { value: "Thẻ ngân hàng", label: "Thẻ ngân hàng" },
  { value: "QR", label: "QR" },
] as const;

export const REVENUE_SERVICES = ["Vé", "Gửi xe"] as const;
export const REVENUE_METHODS = ["Ví điện tử", "Thẻ ngân hàng", "QR"] as const;
