import { Search } from "lucide-react";
import { DataTable, money, Section } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { StationStatRow } from "@/pages/stationstats/stationstats.types";

const count = (value: number) => value.toLocaleString("vi-VN");

export function StationStatsTable({
  rows,
  query,
  onQueryChange,
  onSelectStation,
}: {
  rows: StationStatRow[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelectStation: (stationId: string) => void;
}) {
  return (
    <Section
      title="Chi tiết theo ga (không hiển thị thông tin cá nhân hành khách)"
      action={
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Tìm ga…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      }
    >
      <DataTable
        rows={rows}
        onRow={(row) => onSelectStation(row.stationId)}
        empty="Không có ga phù hợp"
        cols={[
          {
            h: "Ga",
            c: (row) => (
              <span className="flex items-center gap-2 font-medium">
                {row.name}
                {row.interchange && <Badge variant="secondary">Chuyển tuyến</Badge>}
              </span>
            ),
          },
          { h: "Hạng DT", c: (row) => `#${row.revenueRank}`, className: "text-center" },
          { h: "Doanh thu vé", c: (row) => money(row.ticketRevenue), className: "text-right" },
          { h: "Gửi xe", c: (row) => money(row.parkingRevenue), className: "text-right" },
          { h: "DT thuần", c: (row) => money(row.netRevenue), className: "text-right" },
          { h: "Hạng LL", c: (row) => `#${row.flowRank}`, className: "text-center" },
          { h: "Lượt vào", c: (row) => count(row.entries), className: "text-right" },
          { h: "Lượt ra", c: (row) => count(row.exits), className: "text-right" },
          { h: "TB lượt/ngày", c: (row) => count(row.avgDailyFlow), className: "text-right" },
          { h: "DT/lượt vào", c: (row) => money(row.revenuePerEntry), className: "text-right" },
        ]}
      />
    </Section>
  );
}
