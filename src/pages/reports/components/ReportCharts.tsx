import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/components/shared";
import type { ReportRow } from "@/lib/api";
import { chartTooltipStyle } from "@/lib/chart";
import { shortDay } from "@/pages/reports/reports.service";

// Tách riêng để tải thư viện biểu đồ sau cùng: số liệu và bảng hiện trước, không phải chờ.

const compact = new Intl.NumberFormat("vi-VN", { notation: "compact" });
const axis = { tickLine: false, axisLine: false, fontSize: 12 } as const;

/** Cột theo từng dòng báo cáo: số tiền nếu là doanh thu, số lượt nếu là lưu lượng. */
export function ReportBarChart({ rows, money: isMoney }: { rows: ReportRow[]; money: boolean }) {
  const data = rows.map((r) => ({
    label: shortDay(r.label),
    value: isMoney ? (r.amountVnd ?? 0) : r.count,
  }));
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={48} tickFormatter={(value) => compact.format(value)} />
        <Tooltip
          contentStyle={chartTooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) =>
            isMoney ? money(Number(value)) : `${Number(value).toLocaleString("vi-VN")} lượt`
          }
        />
        <Bar
          dataKey="value"
          name={isMoney ? "Doanh thu" : "Lượt"}
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
