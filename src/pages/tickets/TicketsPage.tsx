import { AppShell } from "@/components/app-shell";
import { DistancePricesTable } from "@/pages/tickets/components/DistancePricesTable";
import { TicketTypesTable } from "@/pages/tickets/components/TicketTypesTable";
import { useTickets } from "@/pages/tickets/hooks/useTickets";

export function TicketsPage() {
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
    <AppShell title="Loại vé & giá vé" roles={["ADMIN"]}>
      <TicketTypesTable ticketTypes={ticketTypes} onToggleStatus={toggleTicketType} />
      <DistancePricesTable
        prices={distancePrices}
        edits={edits}
        onPriceEdit={setPriceEdit}
        effectiveDate={effectiveDate}
        onEffectiveDateChange={setEffectiveDate}
        onSubmit={submit}
      />
    </AppShell>
  );
}
