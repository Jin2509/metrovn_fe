import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/components/shared";
import type { ReportRow } from "@/lib/api";
import { chartTooltipStyle } from "@/lib/chart";
import { shortDay } from "@/pages/reports/reports.service";

const compact = new Intl.NumberFormat("vi-VN", { notation: "compact" });

// Tách riêng để tải thư viện biểu đồ sau cùng, không làm chậm phần còn lại của trang tổng quan.
export default function RevenueBars({ rows }: { rows: ReportRow[] }) {
  const data = rows.map((r) => ({ day: shortDay(r.label), amount: r.amountVnd ?? 0 }));
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={48}
          tickFormatter={(v) => compact.format(v)}
        />
        <Tooltip
          contentStyle={chartTooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          formatter={(v) => money(Number(v))}
        />
        <Bar dataKey="amount" name="Doanh thu" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
