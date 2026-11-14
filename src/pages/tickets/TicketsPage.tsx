import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ParkingSquare, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageTabs } from "@/components/app-shell";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { DataTable, LoadState, money, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  apiErrorMessage,
  faresApi,
  ticketPricesApi,
  ticketProductsApi,
  type FareConfig,
  type TicketPriceStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ticketKeys, ticketTypeCatalog } from "@/lib/catalogs";
import { fmtInstant } from "@/lib/query-sync";
import { formatValidity, ticketTypesStore, type TicketTypeRow } from "@/stores/admin";
import { ParkingPanel } from "@/pages/parking";
import { FarePerKmDialog, PriceProposalDialog } from "@/pages/tickets/components/PriceDialogs";

const FARE_MANAGE = "FARE_MANAGE";

const PRICE_STATUS: Record<TicketPriceStatus, { badge: string; label: string }> = {
  PENDING_APPROVAL: { badge: "PENDING", label: "Chờ duyệt" },
  APPROVED: { badge: "APPROVED", label: "Đã duyệt, chờ áp dụng" },
  APPLIED: { badge: "ACTIVE", label: "Đã áp dụng" },
  REJECTED: { badge: "REJECTED", label: "Bị từ chối" },
};

function TicketPricingPanel() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(FARE_MANAGE);
  const queryClient = useQueryClient();
  const products = ticketTypesStore.use();
  const [proposing, setProposing] = useState<TicketTypeRow | null>(null);
  const [toggling, setToggling] = useState("");

  const reloadProducts = () => queryClient.invalidateQueries({ queryKey: ticketKeys.products });

  const toggle = async (t: TicketTypeRow) => {
    setToggling(t.id);
    try {
      if (t.status === "ACTIVE") await ticketProductsApi.deactivate(Number(t.id));
      else await ticketProductsApi.activate(Number(t.id));
      toast.success(t.status === "ACTIVE" ? `Đã ngừng bán ${t.name}` : `Đã mở bán ${t.name}`);
      await reloadProducts();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setToggling("");
    }
  };

  return (
    <>
      <CatalogSection<TicketTypeRow>
        catalog={ticketTypeCatalog}
        title="Loại vé"
        description="Đổi giá loại vé phải lập đề xuất giá và chờ Manager duyệt; vé đã bán giữ giá cũ."
        canEdit={canManage}
        columns={[
          { h: "Mã", c: (t) => <span className="font-mono text-xs">{t.code}</span> },
          { h: "Loại vé", c: (t) => <b>{t.name}</b> },
          { h: "Thời hạn", c: formatValidity },
          { h: "Giá", c: (t) => money(t.price) },
          {
            h: "Trạng thái",
            c: (t) => (
              <StatusBadge s={t.status} label={t.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"} />
            ),
          },
          ...(canManage
            ? [
                {
                  h: "Giá & bán",
                  c: (t: TicketTypeRow) => (
                    <span className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setProposing(t)}>
                        Đề xuất giá
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={toggling === t.id}
                        onClick={() => void toggle(t)}
                      >
                        {t.status === "ACTIVE" ? "Ngừng bán" : "Mở bán"}
                      </Button>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />
      <PriceProposalsSection products={products} />
      <FareSection canManage={canManage} />
      <PriceProposalDialog product={proposing} onClose={() => setProposing(null)} />
    </>
  );
}

/** Các đề xuất giá đã gửi; Manager duyệt ở Hộp phê duyệt. */
function PriceProposalsSection({ products }: { products: TicketTypeRow[] }) {
  const query = useQuery({
    queryKey: ticketKeys.prices,
    queryFn: () => ticketPricesApi.list({ size: 50 }),
    retry: false,
  });
  const nameOf = (productId: number) =>
    products.find((p) => p.id === String(productId))?.name ?? `#${productId}`;
  return (
    <Section title="Đề xuất giá vé" description="Giá được duyệt tự áp dụng từ thời điểm hiệu lực.">
      <LoadState
        loading={query.isPending}
        error={query.error ? apiErrorMessage(query.error) : ""}
        onRetry={() => void query.refetch()}
      />
      {query.data && (
        <DataTable
          rows={query.data.content}
          rowKey={(p) => String(p.id)}
          pageSize={8}
          cols={[
            { h: "Loại vé", c: (p) => <b>{nameOf(p.productId)}</b> },
            { h: "Giá mới", c: (p) => money(p.priceVnd) },
            { h: "Hiệu lực từ", c: (p) => fmtInstant(p.effectiveFrom) },
            { h: "Gửi lúc", c: (p) => fmtInstant(p.submittedAt) },
            {
              h: "Trạng thái",
              c: (p) => (
                <div>
                  <StatusBadge
                    s={PRICE_STATUS[p.status].badge}
                    label={PRICE_STATUS[p.status].label}
                  />
                  {p.rejectionReason && (
                    <p className="mt-1 max-w-56 text-xs text-destructive">{p.rejectionReason}</p>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
    </Section>
  );
}

/** Vé lượt tính theo km: đơn giá/km của từng loại vé lượt. */
function FareSection({ canManage }: { canManage: boolean }) {
  const query = useQuery({ queryKey: ticketKeys.fares, queryFn: faresApi.list, retry: false });
  const [editing, setEditing] = useState<FareConfig | null>(null);
  return (
    <Section
      title="Giá vé lượt theo km"
      description="Giá = khoảng cách × đơn giá/km, làm tròn lên theo bước làm tròn và không thấp hơn giá tối thiểu."
    >
      <LoadState
        loading={query.isPending}
        error={query.error ? apiErrorMessage(query.error) : ""}
        onRetry={() => void query.refetch()}
      />
      {query.data && (
        <DataTable
          rows={query.data}
          rowKey={(f) => f.productCode}
          cols={[
            { h: "Loại vé", c: (f) => <b>{f.productName}</b> },
            { h: "Đơn giá/km", c: (f) => money(f.farePerKmVnd) },
            { h: "Làm tròn", c: (f) => money(f.roundingVnd) },
            { h: "Tối thiểu", c: (f) => money(f.minFareVnd) },
            ...(canManage
              ? [
                  {
                    h: "Thao tác",
                    className: "text-right",
                    c: (f: FareConfig) => (
                      <Button size="sm" variant="outline" onClick={() => setEditing(f)}>
                        Đổi đơn giá
                      </Button>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
      <FarePerKmDialog fare={editing} onClose={() => setEditing(null)} />
    </Section>
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
