import type { User } from "@/mocks/admin";
import type { UserStatusFilter } from "@/pages/users/users.types";

export const USER_ROLE_LABELS: Record<User["role"], string> = {
  STAFF: "Nhân viên ga",
  ACCOUNTANT: "Kế toán",
  PASSENGER: "Hành khách",
  MANAGER: "Manager",
};

export const USER_STATUS_OPTIONS: { value: UserStatusFilter; label: string }[] = [
  { value: "ALL", label: "Mọi trạng thái" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "LOCKED", label: "Đã khóa" },
  { value: "INACTIVE", label: "Ngừng" },
];
