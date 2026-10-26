import { ParkingSquare, Ticket } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { ParkingPanel } from "@/pages/parking";
import { DistancePricesTable } from "@/pages/tickets/components/DistancePricesTable";
import { TicketTypesTable } from "@/pages/tickets/components/TicketTypesTable";
import { useTickets } from "@/pages/tickets/hooks/useTickets";

function TicketPricingPanel() {
  const {
    ticketTypes,
    distancePrices,
    edits,
    setPriceEdit,
    effectiveDate,
    setEffectiveDate,
    submit,
    toggleTicketType,
  } = useTickets();

  return (
    <>
      <TicketTypesTable ticketTypes={ticketTypes} onToggleStatus={toggleTicketType} />
      <DistancePricesTable
        prices={distancePrices}
        edits={edits}
        onPriceEdit={setPriceEdit}
        effectiveDate={effectiveDate}
        onEffectiveDateChange={setEffectiveDate}
        onSubmit={submit}
      />
    </>
  );
}

export function TicketsPage() {
  return (
    <AppShell title="Giá vé & gửi xe">
      <PageTabs
        tabs={[
          {
            value: "tickets",
            label: "Loại vé & giá vé",
            icon: Ticket,
            content: <TicketPricingPanel />,
          },
          { value: "parking", label: "Gửi xe", icon: ParkingSquare, content: <ParkingPanel /> },
        ]}
      />
    </AppShell>
  );
}
