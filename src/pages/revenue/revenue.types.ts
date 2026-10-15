import type { Txn } from "@/mocks/admin";

export type RevenueFilters = {
  from: string;
  to: string;
  service: string;
  method: string;
};

export type DailyRevenuePoint = {
  day: string;
  ve: number;
  guiXe: number;
};

export type RevenueBreakdown = {
  name: string;
  value: number;
};

export type RevenueReport = {
  invalid: boolean;
  rows: Txn[];
  total: number;
  refund: number;
  byDay: DailyRevenuePoint[];
  byService: RevenueBreakdown[];
  byMethod: RevenueBreakdown[];
};
