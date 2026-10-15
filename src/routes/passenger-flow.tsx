import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { AppShell } from "@/components/app-shell";
import { DataTable, Section, StatCard } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hourlyFlow, stations } from "@/mocks/metro";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/passenger-flow")({
  head: seo("Thống kê lưu lượng", "Lưu lượng hành khách theo ga, tuyến và khung giờ."),
  component: Page,
});

function Page() {
  const [sid, setSid] = useState("ALL");
  const [slot, setSlot] = useState("ALL");
  const active = stations.filter((s) => s.status === "ACTIVE");
  const factor =
    sid === "ALL"
      ? 1
      : (active.find((s) => s.id === sid)?.dailyFlow ?? 0) /
        active.reduce((a, s) => a + s.dailyFlow, 0);
  const data = hourlyFlow
    .map((h) => ({ ...h, luot: Math.round(h.luot * factor) }))
    .filter((h) => {
      const n = parseInt(h.hour);
      return slot === "ALL" || (slot === "AM" ? n < 12 : n >= 12);
    });
  const max = Math.max(...data.map((d) => d.luot));
  return (
    <AppShell title="Thống kê lưu lượng" roles={["ADMIN"]}>
      <div className="flex flex-wrap gap-2">
        <Select value={sid} onValueChange={setSid}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toàn Tuyến 1</SelectItem>
            {active.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={slot} onValueChange={setSlot}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Cả ngày</SelectItem>
            <SelectItem value="AM">Buổi sáng</SelectItem>
            <SelectItem value="PM">Chiều – tối</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng lượt"
          value={data.reduce((a, d) => a + d.luot, 0).toLocaleString("vi-VN")}
        />
        <StatCard label="Giờ cao điểm" value={data.find((d) => d.luot === max)?.hour ?? "—"} />
        <StatCard label="Lượt giờ cao điểm" value={max.toLocaleString("vi-VN")} />
      </div>
      <Section title="Lưu lượng theo giờ (cột cam = cao điểm)">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="luot" name="Lượt" radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell
                    key={d.hour}
                    fill={d.luot >= max * 0.8 ? "var(--chart-2)" : "var(--chart-1)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
      <Section title="Theo ga (không hiển thị thông tin cá nhân hành khách)">
        <DataTable
          rows={[...active].sort((a, b) => b.dailyFlow - a.dailyFlow)}
          cols={[
            { h: "Ga", c: (s) => s.name },
            { h: "Lượt/ngày", c: (s) => s.dailyFlow.toLocaleString("vi-VN") },
          ]}
        />
      </Section>
    </AppShell>
  );
}
