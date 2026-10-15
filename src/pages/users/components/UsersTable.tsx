import { DataTable, StatusBadge } from "@/components/shared";
import type { User } from "@/mocks/admin";
import { USER_ROLE_LABELS } from "@/pages/users/users.constants";

export function UsersTable({ rows, onSelect }: { rows: User[]; onSelect: (user: User) => void }) {
  return (
    <DataTable
      rows={rows}
      onRow={onSelect}
      cols={[
        { h: "Mã", c: (user) => user.id },
        { h: "Họ tên", c: (user) => <span className="font-medium">{user.name}</span> },
        { h: "Email", c: (user) => user.email },
        { h: "Vai trò", c: (user) => USER_ROLE_LABELS[user.role] },
        { h: "Ngày tạo", c: (user) => user.createdAt.split("-").reverse().join("/") },
        { h: "Trạng thái", c: (user) => <StatusBadge s={user.status} /> },
      ]}
    />
  );
}
