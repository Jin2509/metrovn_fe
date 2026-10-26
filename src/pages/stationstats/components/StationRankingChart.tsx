import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money, Section } from "@/components/shared";
import { STATION_STATS_TOP_N } from "@/pages/stationstats/stationstats.constants";
import { metricValue } from "@/pages/stationstats/stationstats.service";
import type { StationStatRow, StationStatsMetric } from "@/pages/stationstats/stationstats.types";

const compact = new Intl.NumberFormat("vi-VN", { notation: "compact" });

export function StationRankingChart({
  rows,
  metric,
  focusStationId,
  onSelectStation,
}: {
  rows: StationStatRow[];
  metric: StationStatsMetric;
  focusStationId: string;
  onSelectStation: (stationId: string) => void;
}) {
  const data = rows
    .slice(0, STATION_STATS_TOP_N)
    .map((row) => ({ stationId: row.stationId, name: row.name, value: metricValue(row, metric) }));
  const format = (value: number) =>
    metric === "revenue" ? money(value) : `${value.toLocaleString("vi-VN")} lượt`;

  return (
    <Section
      title={`Top ${data.length} ga theo ${metric === "revenue" ? "doanh thu" : "lưu lượng"}`}
    >
      <div style={{ height: Math.max(160, data.length * 34) }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => compact.format(value)} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => format(Number(value))} />
            <Bar
              dataKey="value"
              name={metric === "revenue" ? "Doanh thu" : "Lưu lượng"}
              radius={[0, 4, 4, 0]}
              className="cursor-pointer"
              onClick={(entry: { stationId?: string }) =>
                entry.stationId && onSelectStation(entry.stationId)
              }
            >
              {data.map((point) => (
                <Cell
                  key={point.stationId}
                  fill={point.stationId === focusStationId ? "var(--chart-2)" : "var(--chart-1)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
