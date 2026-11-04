import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/components/shared";
import { chartTooltipStyle } from "@/lib/chart";
import { PEAK_RATIO } from "@/pages/reports/reports.constants";
import type { HourlyPoint, ReportMetric, ReportTrendPoint } from "@/pages/reports/reports.types";

// Tách riêng để tải thư viện biểu đồ sau cùng: số liệu và bảng hiện trước, không phải chờ.

const compact = new Intl.NumberFormat("vi-VN", { notation: "compact" });
const axis = { tickLine: false, axisLine: false, fontSize: 12 } as const;
const lots = (value: unknown) => `${Number(value).toLocaleString("vi-VN")} lượt`;

export function TrendChart({ data, metric }: { data: ReportTrendPoint[]; metric: ReportMetric }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" {...axis} />
        <YAxis {...axis} width={48} tickFormatter={(value) => compact.format(value)} />
        <Tooltip
          contentStyle={chartTooltipStyle}
          formatter={(value) => (metric === "revenue" ? money(Number(value)) : lots(value))}
        />
        {/* Recharts không đọc phần tử con nằm trong Fragment nên mỗi đường phải đứng riêng. */}
        {metric === "revenue" && <Legend />}
        {metric === "revenue" && (
          <Line
            dataKey="ticketRevenue"
            name="Vé"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
          />
        )}
        {metric === "revenue" && (
          <Line
            dataKey="parkingRevenue"
            name="Gửi xe"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
          />
        )}
        {metric === "flow" && (
          <Line
            dataKey="flow"
            name="Lưu lượng"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HourlyChart({ data, peak }: { data: HourlyPoint[]; peak: number }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="hour" {...axis} interval={1} />
        <YAxis {...axis} width={40} tickFormatter={(value) => compact.format(value)} />
        <Tooltip
          contentStyle={chartTooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          formatter={lots}
        />
        <Bar dataKey="luot" name="Lượt" radius={[4, 4, 0, 0]}>
          {data.map((point) => (
            <Cell
              key={point.hour}
              fill={point.luot >= peak * PEAK_RATIO ? "var(--chart-2)" : "var(--chart-1)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
