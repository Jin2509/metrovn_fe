import { DataTable, Section, StatusBadge } from "@/components/shared";
import type { Train } from "@/pages/trains/trains.types";

export function TrainFleetTable({ trains }: { trains: Train[] }) {
  return (
    <Section title="Đoàn tàu">
      <DataTable
        rows={trains}
        cols={[
          { h: "Mã tàu", c: (train) => train.code },
          { h: "Tuyến", c: (train) => train.line },
          { h: "Số toa", c: (train) => train.cars },
          { h: "Sức chứa", c: (train) => train.capacity.toLocaleString("vi-VN") },
          { h: "Trạng thái", c: (train) => <StatusBadge s={train.status} /> },
        ]}
      />
    </Section>
  );
}
