import { logAction } from "@/mocks/admin";
import type { StationOrder } from "@/pages/lines/lines.types";

export function saveStationOrder(order: StationOrder[], lineCode: string): StationOrder[] | null {
  const orderNumbers = order.map((station) => station.no).sort((a, b) => a - b);
  const isValid =
    orderNumbers.every((number, index) => number === index + 1) &&
    new Set(order.map((station) => station.id)).size === order.length;
  if (!isValid) return null;

  const sortedOrder = [...order].sort((a, b) => a.no - b.no);
  logAction("Sắp xếp thứ tự ga", lineCode);
  return sortedOrder;
}
