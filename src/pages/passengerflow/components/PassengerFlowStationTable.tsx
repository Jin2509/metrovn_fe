import { DataTable, Section } from "@/components/shared";
import type { Station } from "@/mocks/metro";

export function PassengerFlowStationTable({ stations }: { stations: Station[] }) {
  return (
    <Section title="Theo ga (không hiển thị thông tin cá nhân hành khách)">
      <DataTable
        rows={stations}
        cols={[
          { h: "Ga", c: (station) => station.name },
          { h: "Lượt/ngày", c: (station) => station.dailyFlow.toLocaleString("vi-VN") },
        ]}
      />
    </Section>
  );
}
