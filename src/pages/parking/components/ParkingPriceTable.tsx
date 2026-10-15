import { DataTable, money, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ParkingPrice } from "@/pages/parking/parking.types";

export function ParkingPriceTable({
  prices,
  edits,
  onEdit,
  onSubmit,
}: {
  prices: ParkingPrice[];
  edits: Record<string, string>;
  onEdit: (priceId: string, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Section title="Bảng giá theo đơn vị" action={<Button onClick={onSubmit}>Gửi duyệt</Button>}>
      <DataTable
        rows={prices}
        cols={[
          { h: "Loại xe", c: (price) => price.vehicle },
          { h: "Đơn vị", c: (price) => price.unit },
          { h: "Giá hiện hành", c: (price) => money(price.price) },
          {
            h: "Giá đề xuất",
            c: (price) => (
              <Input
                type="number"
                className="h-8 w-32"
                placeholder={String(price.price)}
                value={edits[price.id] ?? ""}
                onChange={(event) => onEdit(price.id, event.target.value)}
              />
            ),
          },
        ]}
      />
    </Section>
  );
}
