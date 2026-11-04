import { ParkingSquare, Ticket } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { money, StatusBadge } from "@/components/shared";
import { ticketTypeCatalog } from "@/lib/catalogs";
import { formatValidity, type TicketTypeRow } from "@/mocks/admin";
import { ParkingPanel } from "@/pages/parking";

function TicketPricingPanel() {
  return (
    <CatalogSection<TicketTypeRow>
      catalog={ticketTypeCatalog}
      title="Loại vé"
      columns={[
        { h: "Mã", c: (t) => <span className="font-mono text-xs">{t.code}</span> },
        { h: "Loại vé", c: (t) => <b>{t.name}</b> },
        { h: "Thời hạn", c: formatValidity },
        { h: "Giá", c: (t) => money(t.price) },
        { h: "Trạng thái", c: (t) => <StatusBadge s={t.status} /> },
      ]}
    />
  );
}

export function TicketsPage() {
  return (
    <AppShell title="Giá vé & gửi xe">
      <PageTabs
        tabs={[
          {
            value: "tickets",
            label: "Loại vé",
            icon: Ticket,
            content: <TicketPricingPanel />,
          },
          { value: "parking", label: "Gửi xe", icon: ParkingSquare, content: <ParkingPanel /> },
        ]}
      />
    </AppShell>
  );
}
