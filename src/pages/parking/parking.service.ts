import { money } from "@/components/shared";
import { submitApproval } from "@/mocks/admin";
import type { ParkingPrice } from "@/pages/parking/parking.types";

export function submitParkingPriceApproval(prices: ParkingPrice[], edits: Record<string, string>) {
  const changes = prices
    .filter((price) => edits[price.id] && Number(edits[price.id]) !== price.price)
    .map((price) => ({
      field: `${price.vehicle} / ${price.unit}`,
      old: money(price.price),
      new: money(Number(edits[price.id])),
    }));
  if (!changes.length) return false;
  submitApproval("PARKING_PRICE", "Điều chỉnh bảng giá gửi xe", changes);
  return true;
}
