import { money } from "@/components/shared";
import { distancePricesStore, submitApproval, ticketTypesStore } from "@/mocks/admin";
import type { DistancePrice, TicketPriceEdit } from "@/pages/tickets/tickets.types";

export function submitTicketPriceApproval(
  prices: DistancePrice[],
  edits: TicketPriceEdit,
  effectiveDate: string,
): string | null {
  const changes = prices
    .filter((price) => edits[price.id] && Number(edits[price.id]) !== price.price)
    .map((price) => ({
      field: `Giá ${price.from}–${price.to} km`,
      old: money(price.price),
      new: money(Number(edits[price.id])),
    }));
  if (!changes.length) return "Chưa có thay đổi giá";
  if (!effectiveDate) return "Vui lòng chọn ngày hiệu lực";
  if (changes.some((change) => !(Number(change.new.replace(/\D/g, "")) > 0)))
    return "Giá phải lớn hơn 0";

  submitApproval("TICKET_PRICE", "Điều chỉnh bảng giá vé theo khoảng cách", [
    ...changes,
    { field: "Hiệu lực từ", old: "—", new: effectiveDate.split("-").reverse().join("/") },
  ]);
  return null;
}

export function toggleTicketTypeStatus(ticketTypeId: string) {
  ticketTypesStore.set((ticketTypes) =>
    ticketTypes.map((ticketType) =>
      ticketType.id === ticketTypeId
        ? { ...ticketType, status: ticketType.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
        : ticketType,
    ),
  );
}
