import type { Txn } from "@/mocks/admin";
import { REVENUE_METHODS, REVENUE_SERVICES } from "@/pages/revenue/revenue.constants";
import type {
  DailyRevenuePoint,
  RevenueBreakdown,
  RevenueFilters,
} from "@/pages/revenue/revenue.types";

export function calculateRevenueReport(transactions: Txn[], filters: RevenueFilters) {
  const invalid = filters.from > filters.to;
  const rows = invalid
    ? []
    : transactions.filter(
        (transaction) =>
          (transaction.status === "SUCCESS" || transaction.status === "REFUNDED") &&
          transaction.at.slice(0, 10) >= filters.from &&
          transaction.at.slice(0, 10) <= filters.to &&
          (filters.service === "ALL" || transaction.service === filters.service) &&
          (filters.method === "ALL" || transaction.method === filters.method),
      );
  const total = rows.reduce((sum, transaction) => sum + transaction.amount, 0);
  const refund = rows.reduce((sum, transaction) => sum + transaction.refund, 0);
  const byDay = Object.values(
    rows.reduce<Record<string, DailyRevenuePoint>>((accumulator, transaction) => {
      const day = transaction.at.slice(8, 10) + "/" + transaction.at.slice(5, 7);
      accumulator[day] ??= { day, ve: 0, guiXe: 0 };
      if (transaction.service === "Vé") accumulator[day].ve += transaction.amount;
      else accumulator[day].guiXe += transaction.amount;
      return accumulator;
    }, {}),
  ).sort((first, second) => first.day.localeCompare(second.day));
  const byService: RevenueBreakdown[] = REVENUE_SERVICES.map((service) => ({
    name: service,
    value: rows
      .filter((transaction) => transaction.service === service)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  }));
  const byMethod: RevenueBreakdown[] = REVENUE_METHODS.map((method) => ({
    name: method,
    value: rows
      .filter((transaction) => transaction.method === method)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  }));

  return { invalid, rows, total, refund, byDay, byService, byMethod };
}
