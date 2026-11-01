import { format, parseISO } from "date-fns";
import { DataTable, StatusBadge, type Col } from "@/components/shared";
import type { AdminUser } from "@/lib/api";
import { userRoleLabel } from "@/pages/users/users.constants";
import type { UserScope } from "@/pages/users/users.types";

export function UsersTable({
  rows,
  scope,
  loading,
  onSelect,
}: {
  rows: AdminUser[];
  scope: UserScope;
  loading: boolean;
  onSelect: (user: AdminUser) => void;
}) {
  const cols: Col<AdminUser>[] = [
    { h: "Họ tên", c: (user) => <span className="font-medium">{user.fullName}</span> },
    { h: "Email", c: (user) => user.email },
    ...(scope === "internal"
      ? [{ h: "Vai trò", c: (user: AdminUser) => user.roles.map(userRoleLabel).join(", ") }]
      : []),
    {
      h: scope === "internal" ? "Ngày tạo" : "Ngày đăng ký",
      c: (user) => format(parseISO(user.createdAt), "dd/MM/yyyy"),
    },
    { h: "Trạng thái", c: (user) => <StatusBadge s={user.status} /> },
  ];
  const empty = scope === "internal" ? "Không có nhân sự phù hợp" : "Không có hành khách phù hợp";
  return (
    <DataTable
      rows={rows}
      onRow={onSelect}
      cols={cols}
      empty={loading ? "Đang tải dữ liệu…" : empty}
    />
  );
}
