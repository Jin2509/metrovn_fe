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
import { Section } from "@/components/shared";
import type { PassengerFlowPoint } from "@/pages/passengerflow/passengerflow.types";

export function PassengerFlowChart({ data, max }: { data: PassengerFlowPoint[]; max: number }) {
  return (
    <Section title="Lưu lượng theo giờ (cột cam = cao điểm)">
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="luot" name="Lượt" radius={[4, 4, 0, 0]}>
              {data.map((point) => (
                <Cell
                  key={point.hour}
                  fill={point.luot >= max * 0.8 ? "var(--chart-2)" : "var(--chart-1)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}
