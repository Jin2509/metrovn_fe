import { Plus } from "lucide-react";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Promo } from "@/mocks/admin";
import { formatPromotionDate } from "@/pages/promotions/promotions.utils";

export function PromotionTable({
  promos,
  onToggleStatus,
  onCreate,
}: {
  promos: Promo[];
  onToggleStatus: (promoId: string) => void;
  onCreate: () => void;
}) {
  return (
    <Section
      title="Chương trình khuyến mãi"
      action={
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Tạo khuyến mãi
        </Button>
      }
    >
      <DataTable
        rows={promos}
        cols={[
          { h: "Tên", c: (promo) => <b>{promo.name}</b> },
          { h: "Giảm", c: (promo) => `${promo.discount}%` },
          {
            h: "Thời gian",
            c: (promo) => `${formatPromotionDate(promo.start)} – ${formatPromotionDate(promo.end)}`,
          },
          { h: "Trạng thái", c: (promo) => <StatusBadge s={promo.status} /> },
          {
            h: "",
            c: (promo) =>
              (promo.status === "ACTIVE" || promo.status === "INACTIVE") && (
                <Button size="sm" variant="ghost" onClick={() => onToggleStatus(promo.id)}>
                  {promo.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
                </Button>
              ),
          },
        ]}
      />
    </Section>
  );
}
