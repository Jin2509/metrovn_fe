import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Bus, Ticket, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { LazyMap } from "@/components/lazy-map";
import { getVisibleNavGroups } from "@/components/layout/nav.config";
import { Section, StatCard } from "@/components/shared";
import { useAuth } from "@/lib/auth";
import { busRoutes, busStops, hourlyFlow, revenue7d, stations } from "@/mocks/metro";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  fontSize: 12,
};

function QuickLinks() {
  const { role } = useAuth();
  const items = role
    ? getVisibleNavGroups(role)
        .flatMap((g) => g.items)
        .filter((i) => i.to !== "/")
    : [];
  if (!items.length) return null;

  return (
    <Section title="Truy cập nhanh" description="Các chức năng vai trò của bạn được sử dụng">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-sm font-medium">
                {item.label}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const active = stations.filter((s) => s.status === "ACTIVE");
  const flow = active.reduce((a, s) => a + s.dailyFlow, 0);

  return (
    <AppShell
      title={user ? `Xin chào, ${user.name}` : "Tổng quan"}
      description="Tình hình vận hành và kinh doanh hôm nay"
      actions={user && <RoleBadge role={user.role} />}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doanh thu hôm nay"
          value="512.400.000 ₫"
          hint="Vé lượt, vé kỳ và gửi xe"
          icon={Wallet}
        />
        <StatCard
          label="Vé đã bán"
          value="48.215"
          hint="Tất cả kênh bán"
          icon={Ticket}
          tone="accent"
        />
        <StatCard
          label="Lượt vào/ra"
          value={flow.toLocaleString("vi-VN")}
          hint={`${active.length} ga đang hoạt động`}
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Kết nối xe buýt"
          value={`${busRoutes.length} tuyến`}
          hint={`${busStops.length} trạm quanh ga`}
          icon={Bus}
          tone="muted"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Doanh thu 7 ngày" description="Đơn vị: triệu ₫">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={revenue7d}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  dataKey="ve"
                  name="Vé"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  dataKey="guiXe"
                  name="Gửi xe"
                  stroke="var(--chart-2)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Lưu lượng theo giờ" description="Tổng lượt vào/ra toàn mạng lưới">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={hourlyFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="luot" name="Lượt" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
      <QuickLinks />
      <Section title="Bản đồ mạng lưới" description="Tuyến Metro, ga và trạm buýt kết nối">
        <LazyMap height={380} />
      </Section>
    </AppShell>
  );
}
