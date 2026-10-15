import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { money, Section } from "@/components/shared";
import type { RevenueBreakdown } from "@/pages/revenue/revenue.types";

export function ServiceRevenueChart({ data }: { data: RevenueBreakdown[] }) {
  return (
    <Section title="Theo dịch vụ">
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>
              {data.map((_, index) => (
                <Cell key={index} fill={`var(--chart-${index + 1})`} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => money(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
