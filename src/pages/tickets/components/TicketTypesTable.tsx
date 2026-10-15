import { DataTable, money, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { TicketType } from "@/pages/tickets/tickets.types";

export function TicketTypesTable({
  ticketTypes,
  onToggleStatus,
}: {
  ticketTypes: TicketType[];
  onToggleStatus: (ticketTypeId: string) => void;
}) {
  return (
    <Section title="Loại vé">
      <DataTable
        rows={ticketTypes}
        cols={[
          { h: "Loại vé", c: (ticketType) => <b>{ticketType.name}</b> },
          { h: "Thời hạn", c: (ticketType) => ticketType.validity },
          {
            h: "Giá",
            c: (ticketType) => (ticketType.price ? money(ticketType.price) : "Theo khoảng cách"),
          },
          { h: "Trạng thái", c: (ticketType) => <StatusBadge s={ticketType.status} /> },
          {
            h: "",
            c: (ticketType) => (
              <Button size="sm" variant="ghost" onClick={() => onToggleStatus(ticketType.id)}>
                {ticketType.status === "ACTIVE" ? "Ngừng bán" : "Mở bán"}
              </Button>
            ),
          },
        ]}
      />
    </Section>
  );
}
