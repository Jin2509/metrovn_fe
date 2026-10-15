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
import type { DailyRevenuePoint } from "@/pages/revenue/revenue.types";

export function DailyRevenueChart({ data }: { data: DailyRevenuePoint[] }) {
  return (
    <Section title="Doanh thu theo ngày">
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => money(Number(value))} />
            <Legend />
            <Line dataKey="ve" name="Vé" stroke="var(--chart-1)" strokeWidth={2} />
            <Line dataKey="guiXe" name="Gửi xe" stroke="var(--chart-2)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
