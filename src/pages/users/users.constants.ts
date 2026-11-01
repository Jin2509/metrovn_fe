import type { AdminUser } from "@/lib/api";
import type { UserScope, UserStatusFilter } from "@/pages/users/users.types";

export const PASSENGER_ROLE = "PASSENGER";

const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  STAFF: "Nhân viên ga",
  ACCOUNTANT: "Kế toán",
  PASSENGER: "Hành khách",
  MANAGER: "Manager",
};

/** Vai trò do admin tự tạo chưa có nhãn thì hiện mã. */
export const userRoleLabel = (code: string) => USER_ROLE_LABELS[code] ?? code;

export const isInScope = (user: AdminUser, scope: UserScope) => {
  const passengerOnly = user.roles.every((role) => role === PASSENGER_ROLE);
  return scope === "passenger" ? passengerOnly : !passengerOnly;
};

export const USER_STATUS_OPTIONS: { value: UserStatusFilter; label: string }[] = [
  { value: "ALL", label: "Mọi trạng thái" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "LOCKED", label: "Đã khóa" },
  { value: "PENDING_VERIFICATION", label: "Chưa xác thực" },
];
