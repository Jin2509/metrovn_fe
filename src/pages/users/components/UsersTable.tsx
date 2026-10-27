import { DataTable, StatusBadge, type Col } from "@/components/shared";
import type { User } from "@/mocks/admin";
import { USER_ROLE_LABELS } from "@/pages/users/users.constants";
import type { UserScope } from "@/pages/users/users.types";

export function UsersTable({
  rows,
  scope,
  onSelect,
}: {
  rows: User[];
  scope: UserScope;
  onSelect: (user: User) => void;
}) {
  const cols: Col<User>[] = [
    { h: "Mã", c: (user) => user.id },
    { h: "Họ tên", c: (user) => <span className="font-medium">{user.name}</span> },
    { h: "Email", c: (user) => user.email },
    ...(scope === "internal"
      ? [{ h: "Vai trò", c: (user: User) => USER_ROLE_LABELS[user.role] }]
      : []),
    {
      h: scope === "internal" ? "Ngày tạo" : "Ngày đăng ký",
      c: (user) => user.createdAt.split("-").reverse().join("/"),
    },
    { h: "Trạng thái", c: (user) => <StatusBadge s={user.status} /> },
  ];
  return (
    <DataTable
      rows={rows}
      onRow={onSelect}
      cols={cols}
      empty={scope === "internal" ? "Không có nhân sự phù hợp" : "Không có hành khách phù hợp"}
    />
  );
}
