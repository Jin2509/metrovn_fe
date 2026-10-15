import { Link } from "@tanstack/react-router";
import {
  Bus,
  LayoutDashboard,
  Map,
  TrainFront,
  Building2,
  Users,
  UserCog,
  Route as RouteIcon,
  Ticket,
  ParkingSquare,
  BadgePercent,
  Crown,
  Megaphone,
  Activity,
  ScrollText,
  Inbox,
  FileCheck2,
  LineChart,
  Receipt,
  ListChecks,
  Lock,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { Chatbot } from "./chatbot";
import { approvalsStore, currentUser, roleLabel, roleStore, type Role } from "@/mocks/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Item = { to: string; label: string; icon: typeof Map; roles: Role[] };
const A: Role[] = ["ADMIN"],
  M: Role[] = ["MANAGER"],
  AC: Role[] = ["ACCOUNTANT"];
export const navGroups: { title: string; items: Item[] }[] = [
  {
    title: "Chung",
    items: [
      {
        to: "/",
        label: "Tổng quan",
        icon: LayoutDashboard,
        roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
      },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      { to: "/users", label: "Người dùng", icon: Users, roles: A },
      { to: "/assignments", label: "Phân công ga", icon: UserCog, roles: A },
    ],
  },
  {
    title: "Mạng lưới",
    items: [
      { to: "/map", label: "Bản đồ hệ thống", icon: Map, roles: A },
      { to: "/lookup", label: "Tra cứu & chỉ đường", icon: Map, roles: A },
      { to: "/stations", label: "Quản lý ga", icon: Building2, roles: A },
      { to: "/lines", label: "Tuyến & thứ tự ga", icon: RouteIcon, roles: A },
      { to: "/buses", label: "Liên kết xe buýt", icon: Bus, roles: A },
      { to: "/trains", label: "Tàu & vận hành", icon: TrainFront, roles: A },
    ],
  },
  {
    title: "Kinh doanh",
    items: [
      { to: "/tickets", label: "Loại vé & giá vé", icon: Ticket, roles: A },
      { to: "/parking", label: "Gửi xe", icon: ParkingSquare, roles: A },
      { to: "/promotions", label: "Khuyến mãi", icon: BadgePercent, roles: A },
      { to: "/membership-tiers", label: "Hạng thành viên", icon: Crown, roles: A },
      { to: "/notifications", label: "Thông báo vận hành", icon: Megaphone, roles: A },
    ],
  },
  {
    title: "Điều hành",
    items: [
      { to: "/approvals", label: "Hộp phê duyệt", icon: Inbox, roles: M },
      { to: "/policies", label: "Chính sách áp dụng", icon: FileCheck2, roles: M },
    ],
  },
  {
    title: "Tài chính",
    items: [
      { to: "/transactions", label: "Giao dịch", icon: Receipt, roles: ["ADMIN", "ACCOUNTANT"] },
      {
        to: "/reconciliation",
        label: "Đối soát",
        icon: ListChecks,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        to: "/revenue",
        label: "Thống kê doanh thu",
        icon: LineChart,
        roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
      },
      { to: "/period-closing", label: "Chốt kỳ", icon: Lock, roles: AC },
    ],
  },
  {
    title: "Giám sát",
    items: [
      { to: "/passenger-flow", label: "Thống kê lưu lượng", icon: Activity, roles: A },
      { to: "/audit-logs", label: "Nhật ký hệ thống", icon: ScrollText, roles: A },
    ],
  },
];

export function AppShell({
  title,
  roles,
  actions,
  children,
}: {
  title: string;
  roles?: Role[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const role = roleStore.use();
  const pending = approvalsStore.use().filter((a) => a.status === "PENDING").length;
  const allowed = !roles || roles.includes(role);
  const groups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) }))
    .filter((g) => g.items.length);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <TrainFront className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sidebar-accent-foreground">Metro Admin</p>
            <p className="text-xs opacity-60">TP. Hồ Chí Minh</p>
          </div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-50">
                {g.title}
              </p>
              {g.items.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"
                  activeProps={{
                    className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                  }}
                  activeOptions={{ exact: true }}
                >
                  <n.icon className="h-4 w-4" />
                  <span className="flex-1">{n.label}</span>
                  {n.to === "/approvals" && pending > 0 && (
                    <span className="rounded-full bg-accent px-1.5 text-xs text-accent-foreground">
                      {pending}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="m-3 space-y-2 rounded-lg bg-sidebar-accent p-3 text-xs">
          <p>
            Đăng nhập: <b className="text-sidebar-accent-foreground">{currentUser(role)}</b>
          </p>
          <Select value={role} onValueChange={(v) => roleStore.set(() => v as Role)}>
            <SelectTrigger className="h-8 border-sidebar-border bg-sidebar text-sidebar-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabel) as Role[]).map((r) => (
                <SelectItem key={r} value={r}>
                  Vai trò: {roleLabel[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-3 border-b bg-card px-6 py-4">
          <h1 className="flex-1 text-lg font-semibold">{title}</h1>
          <div className="md:hidden">
            <Select value={role} onValueChange={(v) => roleStore.set(() => v as Role)}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(roleLabel) as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {allowed && actions}
        </header>
        <div className="flex gap-1 overflow-x-auto border-b bg-card px-4 py-2 md:hidden">
          {groups
            .flatMap((g) => g.items)
            .map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="shrink-0 rounded-md p-2 hover:bg-muted"
                title={n.label}
              >
                <n.icon className="h-4 w-4" />
              </Link>
            ))}
        </div>
        <main className="space-y-6 p-6">
          {allowed ? (
            children
          ) : (
            <div className="flex flex-col items-center py-24 text-center">
              <ShieldAlert className="h-12 w-12 text-destructive" />
              <p className="mt-3 text-lg font-semibold">Bạn không có quyền truy cập</p>
              <p className="text-sm text-muted-foreground">
                Vai trò {roleLabel[role]} không được phép mở màn hình này.
              </p>
            </div>
          )}
        </main>
      </div>
      <Chatbot />
    </div>
  );
}
