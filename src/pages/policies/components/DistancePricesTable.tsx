import { DataTable, money, Section } from "@/components/shared";
import type { DistancePrice } from "@/pages/policies/policies.types";

export function DistancePricesTable({ prices }: { prices: DistancePrice[] }) {
  return (
    <Section title="Giá vé lượt">
      <DataTable
        rows={prices}
        cols={[
          { h: "Khoảng cách", c: (price) => `${price.from}–${price.to} km` },
          { h: "Giá", c: (price) => money(price.price) },
          { h: "Hiệu lực", c: (price) => price.effective },
        ]}
      />
    </Section>
  );
}
