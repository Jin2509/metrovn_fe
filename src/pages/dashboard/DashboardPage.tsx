import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { useAuth, type Role } from "@/lib/auth";
import { AccountantDashboard } from "@/pages/dashboard/components/AccountantDashboard";
import { AdminDashboard } from "@/pages/dashboard/components/AdminDashboard";
import { ManagerDashboard } from "@/pages/dashboard/components/ManagerDashboard";

const DASHBOARDS: Record<Role, { description: string; Component: () => ReactNode }> = {
  ADMIN: {
    description: "Vận hành mạng lưới, chatbot và các thay đổi đang chờ duyệt",
    Component: AdminDashboard,
  },
  MANAGER: {
    description: "Yêu cầu chờ phê duyệt, doanh thu và chất lượng phục vụ",
    Component: ManagerDashboard,
  },
  ACCOUNTANT: {
    description: "Giao dịch cần đối soát, hoàn tiền và tình trạng chốt kỳ",
    Component: AccountantDashboard,
  },
};

/** Trang tổng quan: mỗi vai trò thấy chỉ số và đầu việc của riêng mình. */
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  const { description, Component } = DASHBOARDS[user.role];

  return (
    <AppShell
      title={`Xin chào, ${user.name}`}
      description={description}
      actions={<RoleBadge role={user.role} />}
    >
      <Component />
    </AppShell>
  );
}
