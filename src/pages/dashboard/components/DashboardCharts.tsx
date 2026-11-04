import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartTooltipStyle } from "@/lib/chart";
import { revenue7d } from "@/mocks/metro";

// Tách riêng để tải thư viện biểu đồ sau cùng, không làm chậm phần còn lại của trang tổng quan.
export default function RevenueLines() {
  return (
    <ResponsiveContainer>
      <LineChart data={revenue7d}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Line dataKey="ve" name="Vé" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
        <Line dataKey="guiXe" name="Gửi xe" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
