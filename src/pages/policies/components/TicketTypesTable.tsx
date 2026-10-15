import { DataTable, money, Section } from "@/components/shared";
import type { TicketType } from "@/pages/policies/policies.types";

export function TicketTypesTable({ ticketTypes }: { ticketTypes: TicketType[] }) {
  return (
    <Section title="Thời hạn vé">
      <DataTable
        rows={ticketTypes}
        cols={[
          { h: "Loại", c: (ticketType) => ticketType.name },
          { h: "Thời hạn", c: (ticketType) => ticketType.validity },
          { h: "Giá", c: (ticketType) => (ticketType.price ? money(ticketType.price) : "Theo km") },
        ]}
      />
    </Section>
  );
}
