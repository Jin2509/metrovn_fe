import { useState } from "react";
import { toast } from "sonner";
import { parkingLots, parkingPricesStore } from "@/mocks/admin";
import { stations } from "@/mocks/metro";
import { submitParkingPriceApproval } from "@/pages/parking/parking.service";

export function useParking() {
  const prices = parkingPricesStore.use();
  const [edits, setEdits] = useState<Record<string, string>>({});

  const setEdit = (priceId: string, value: string) => {
    setEdits({ ...edits, [priceId]: value });
  };

  const submit = () => {
    if (!submitParkingPriceApproval(prices, edits)) return toast.error("Chưa có thay đổi");
    setEdits({});
    toast.success("Đã gửi Manager duyệt");
  };

  return { lots: parkingLots, stations, prices, edits, setEdit, submit };
}
