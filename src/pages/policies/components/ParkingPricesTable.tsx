import { DataTable, money, Section } from "@/components/shared";
import type { ParkingPrice } from "@/pages/policies/policies.types";

export function ParkingPricesTable({ prices }: { prices: ParkingPrice[] }) {
  return (
    <Section title="Giá gửi xe">
      <DataTable
        rows={prices}
        cols={[
          { h: "Loại xe", c: (price) => price.vehicle },
          { h: "Đơn vị", c: (price) => price.unit },
          { h: "Giá", c: (price) => money(price.price) },
        ]}
      />
    </Section>
  );
}
