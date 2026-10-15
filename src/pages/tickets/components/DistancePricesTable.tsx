import { DataTable, money, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DistancePrice } from "@/pages/tickets/tickets.types";

export function DistancePricesTable({
  prices,
  edits,
  onPriceEdit,
  effectiveDate,
  onEffectiveDateChange,
  onSubmit,
}: {
  prices: DistancePrice[];
  edits: Record<string, string>;
  onPriceEdit: (priceId: string, value: string) => void;
  effectiveDate: string;
  onEffectiveDateChange: (date: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Section
      title="Bảng giá vé lượt theo khoảng cách"
      action={
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="h-9 w-40"
            value={effectiveDate}
            onChange={(event) => onEffectiveDateChange(event.target.value)}
          />
          <Button onClick={onSubmit}>Gửi duyệt</Button>
        </div>
      }
    >
      <p className="mb-3 rounded-md bg-accent/15 p-2 text-sm">
        Lưu ý: giá mới chỉ áp dụng cho vé đặt sau ngày hiệu lực.
      </p>
      <DataTable
        rows={prices}
        cols={[
          { h: "Khoảng cách", c: (price) => `${price.from} – ${price.to} km` },
          { h: "Giá hiện hành", c: (price) => money(price.price) },
          { h: "Hiệu lực", c: (price) => price.effective },
          {
            h: "Giá đề xuất",
            c: (price) => (
              <Input
                type="number"
                className="h-8 w-32"
                placeholder={String(price.price)}
                value={edits[price.id] ?? ""}
                onChange={(event) => onPriceEdit(price.id, event.target.value)}
              />
            ),
          },
        ]}
      />
    </Section>
  );
}
