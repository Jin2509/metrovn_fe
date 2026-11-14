import { DataTable, money, Section } from "@/components/shared";
import { VEHICLE_LABEL } from "@/stores/admin";
import type { ParkingPrice } from "@/pages/policies/policies.types";

export function ParkingPricesTable({ prices }: { prices: ParkingPrice[] }) {
  return (
    <Section title="Giá gửi xe">
      <DataTable
        rows={prices}
        rowKey={(p) => p.id}
        cols={[
          { h: "Bãi", c: (p) => p.lotName },
          { h: "Loại xe", c: (p) => VEHICLE_LABEL[p.vehicleType] },
          { h: "Lượt ngày", c: (p) => money(p.dayPrice) },
          { h: "Vé tháng", c: (p) => money(p.monthlyPrice) },
        ]}
      />
    </Section>
  );
}
