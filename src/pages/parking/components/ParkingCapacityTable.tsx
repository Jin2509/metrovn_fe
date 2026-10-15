import { DataTable, Section } from "@/components/shared";
import type { ParkingLot } from "@/pages/parking/parking.types";

export function ParkingCapacityTable({ lots }: { lots: ParkingLot[] }) {
  return (
    <Section title="Sức chứa">
      <DataTable
        rows={lots}
        cols={[
          { h: "Bãi", c: (lot) => lot.name },
          { h: "Xe đạp", c: (lot) => lot.bike },
          { h: "Xe máy", c: (lot) => lot.moto },
          { h: "Ô tô", c: (lot) => lot.car },
        ]}
      />
    </Section>
  );
}
