import { DataTable, money, Section } from "@/components/shared";
import { formatValidity } from "@/mocks/admin";
import type { TicketType } from "@/pages/policies/policies.types";

export function TicketTypesTable({ ticketTypes }: { ticketTypes: TicketType[] }) {
  return (
    <Section title="Loại vé">
      <DataTable
        rows={ticketTypes}
        cols={[
          { h: "Loại", c: (ticketType) => ticketType.name },
          { h: "Thời hạn", c: formatValidity },
          { h: "Giá", c: (ticketType) => money(ticketType.price) },
        ]}
      />
    </Section>
  );
}
