import { DataTable, Section } from "@/components/shared";
import { Progress } from "@/components/ui/progress";
import type { ParkingLot } from "@/pages/parking/parking.types";
import type { Station } from "@/mocks/metro";

export function ParkingLotsTable({ lots, stations }: { lots: ParkingLot[]; stations: Station[] }) {
  return (
    <Section title="Bãi xe">
      <DataTable
        rows={lots}
        cols={[
          { h: "Bãi", c: (lot) => <b>{lot.name}</b> },
          { h: "Ga", c: (lot) => stations.find((station) => station.id === lot.stationId)?.name },
          {
            h: "Tỷ lệ lấp đầy",
            c: (lot) => (
              <div className="flex w-48 items-center gap-2">
                <Progress value={lot.used * 100} />
                <span className="text-xs">{Math.round(lot.used * 100)}%</span>
              </div>
            ),
          },
        ]}
      />
    </Section>
  );
}
