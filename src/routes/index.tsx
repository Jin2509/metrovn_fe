import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { LazyMap } from "@/components/lazy-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { busRoutes, busStops, hourlyFlow, revenue7d, stations } from "@/mocks/metro";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tổng quan · Metro Admin TP.HCM" },
      {
        name: "description",
        content: "Bảng điều khiển quản trị Metro: doanh thu, lưu lượng, bản đồ và kết nối xe buýt.",
      },
      { property: "og:title", content: "Tổng quan · Metro Admin TP.HCM" },
      { property: "og:description", content: "Bảng điều khiển quản trị Metro TP.HCM." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const active = stations.filter((s) => s.status === "ACTIVE");
  const kpis = [
    ["Doanh thu hôm nay", "512.400.000 ₫"],
    ["Vé đã bán", "48.215"],
    ["Lượt vào/ra", active.reduce((a, s) => a + s.dailyFlow, 0).toLocaleString("vi-VN")],
    ["Tuyến buýt kết nối", `${busRoutes.length} tuyến · ${busStops.length} trạm`],
  ];
  return (
    <AppShell title="Tổng quan">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([k, v]) => (
          <Card key={k}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{k}</p>
              <p className="mt-1 text-2xl font-bold">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doanh thu 7 ngày (triệu ₫)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={revenue7d}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line dataKey="ve" name="Vé" stroke="var(--chart-1)" strokeWidth={2} />
                <Line dataKey="guiXe" name="Gửi xe" stroke="var(--chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lưu lượng theo giờ</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={hourlyFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="luot" name="Lượt" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Bản đồ mạng lưới</CardTitle>
        </CardHeader>
        <CardContent>
          <LazyMap height={380} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
