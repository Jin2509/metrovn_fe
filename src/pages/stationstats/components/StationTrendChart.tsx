import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { StationTrendPoint } from "@/pages/stationstats/stationstats.types";

const compact = new Intl.NumberFormat("vi-VN", { notation: "compact" });

export function StationTrendChart({
  data,
  stationName,
  onReset,
}: {
  data: StationTrendPoint[];
  stationName: string | null;
  onReset: () => void;
}) {
  return (
    <Section
      title={`Xu hướng theo ngày · ${stationName ? `Ga ${stationName}` : "toàn phạm vi lọc"}`}
      action={
        stationName && (
          <Button size="sm" variant="outline" onClick={onReset}>
            Xem toàn bộ
          </Button>
        )
      }
    >
      <div className="h-72">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="revenue" tickFormatter={(value) => compact.format(value)} />
            <YAxis
              yAxisId="flow"
              orientation="right"
              tickFormatter={(value) => compact.format(value)}
            />
            <Tooltip
              formatter={(value, name) =>
                name === "Doanh thu"
                  ? money(Number(value))
                  : `${Number(value).toLocaleString("vi-VN")} lượt`
              }
            />
            <Legend />
            <Line
              yAxisId="revenue"
              dataKey="revenue"
              name="Doanh thu"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="flow"
              dataKey="flow"
              name="Lưu lượng"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
