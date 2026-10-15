import { useState } from "react";
import { toast } from "sonner";
import { distancePricesStore, ticketTypesStore } from "@/mocks/admin";
import { submitTicketPriceApproval, toggleTicketTypeStatus } from "@/pages/tickets/tickets.service";
import type { TicketPriceEdit } from "@/pages/tickets/tickets.types";

export function useTickets() {
  const ticketTypes = ticketTypesStore.use();
  const distancePrices = distancePricesStore.use();
  const [edits, setEdits] = useState<TicketPriceEdit>({});
  const [effectiveDate, setEffectiveDate] = useState("");

  const setPriceEdit = (priceId: string, value: string) => {
    setEdits({ ...edits, [priceId]: value });
  };

  const submit = () => {
    const error = submitTicketPriceApproval(distancePrices, edits, effectiveDate);
    if (error) return toast.error(error);
    setEdits({});
    toast.success("Đã gửi Manager duyệt");
  };

  const toggleTicketType = (ticketTypeId: string) => {
    toggleTicketTypeStatus(ticketTypeId);
    toast.success("Đã cập nhật");
  };

  return {
    ticketTypes,
    distancePrices,
    edits,
    setPriceEdit,
    effectiveDate,
    setEffectiveDate,
    submit,
    toggleTicketType,
  };
}
