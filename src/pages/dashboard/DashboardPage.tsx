import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth, type ProtectedPath, type Role } from "@/lib/auth";
import { AccountantDashboard } from "@/pages/dashboard/components/AccountantDashboard";
import { AdminDashboard } from "@/pages/dashboard/components/AdminDashboard";
import { ManagerDashboard } from "@/pages/dashboard/components/ManagerDashboard";

const DASHBOARDS: Record<
  Role,
  { Component: () => ReactNode; actions: { label: string; to: ProtectedPath }[] }
> = {
  ADMIN: {
    Component: AdminDashboard,
    actions: [
      { label: "Xem báo cáo", to: "/reports" },
      { label: "Soạn thông báo", to: "/notifications" },
    ],
  },
  MANAGER: { Component: ManagerDashboard, actions: [{ label: "Xem báo cáo", to: "/reports" }] },
  ACCOUNTANT: {
    Component: AccountantDashboard,
    actions: [
      { label: "Chốt kỳ", to: "/period-closing" },
      { label: "Xuất báo cáo", to: "/reports" },
    ],
  },
};

const today = () =>
  new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/** Trang tổng quan: mỗi vai trò thấy số liệu chính và làm được việc chính ngay tại đây. */
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  const { Component, actions } = DASHBOARDS[user.role];

  return (
    <AppShell
      title="Tổng quan"
      description={today()}
      actions={actions.map((action, index) => (
        <Button
          key={action.to}
          asChild
          size="sm"
          variant={index === actions.length - 1 ? "default" : "outline"}
        >
          <Link to={action.to}>{action.label}</Link>
        </Button>
      ))}
    >
      <Component />
    </AppShell>
  );
}
