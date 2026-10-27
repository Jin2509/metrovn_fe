import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, type LucideIcon } from "lucide-react";
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
import { getVisibleNavGroups } from "@/components/layout/nav.config";
import { Section } from "@/components/shared";
import { chartTooltipStyle } from "@/lib/chart";
import { useAuth, type ProtectedPath } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { hourlyFlow, revenue7d } from "@/mocks/metro";

export function RevenueChart() {
  return (
    <Section title="Doanh thu 7 ngày" description="Đơn vị: triệu ₫">
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={revenue7d}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Line dataKey="ve" name="Vé" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
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
  );
}

export function HourlyFlowChart() {
  return (
    <Section title="Lưu lượng theo giờ" description="Tổng lượt vào/ra toàn mạng lưới">
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={hourlyFlow}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="luot" name="Lượt" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

export type DashboardTask = {
  label: string;
  hint: string;
  count: number;
  icon: LucideIcon;
  to: ProtectedPath;
  tab?: string;
  tone?: "accent" | "destructive" | "primary";
};

const taskTones = {
  accent: "bg-accent/15 text-accent-foreground",
  destructive: "bg-destructive/10 text-destructive",
  primary: "bg-primary/10 text-primary",
} as const;

/** Danh sách việc cần làm của vai trò — mỗi dòng dẫn thẳng tới đúng màn hình/tab xử lý. */
export function TaskList({
  tasks,
  title = "Việc cần xử lý",
}: {
  tasks: DashboardTask[];
  title?: string;
}) {
  const open = tasks.filter((t) => t.count > 0);
  return (
    <Section
      title={title}
      description={open.length ? `${open.length} đầu việc đang chờ bạn` : "Không có việc tồn đọng"}
    >
      <ul className="divide-y">
        {tasks.map((t) => (
          <li key={t.label}>
            <Link
              to={t.to}
              search={(t.tab ? { tab: t.tab } : {}) as never}
              className={cn(
                "group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60",
                t.count === 0 && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  taskTones[t.tone ?? "primary"],
                )}
              >
                <t.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="truncate text-xs text-muted-foreground">{t.hint}</p>
              </div>
              <span className="text-lg font-semibold tabular-nums">{t.count}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function QuickLinks() {
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
