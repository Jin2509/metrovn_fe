import { logAction, periodsStore } from "@/mocks/admin";

export function closeAccountingPeriod(month: string | null) {
  periodsStore.set((periods) =>
    periods.map((period) => (period.month === month ? { ...period, closed: true } : period)),
  );
  logAction("Chốt kỳ", month ?? "");
}
