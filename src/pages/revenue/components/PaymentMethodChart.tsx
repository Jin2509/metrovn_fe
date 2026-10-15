import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, Section } from "@/components/shared";
import type { RevenueBreakdown } from "@/pages/revenue/revenue.types";

export function PaymentMethodChart({ data }: { data: RevenueBreakdown[] }) {
  return (
    <Section title="Theo phương thức thanh toán">
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => money(Number(value))} />
            <Bar dataKey="value" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
