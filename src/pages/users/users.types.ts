import type { AccountStatus } from "@/lib/api";

/** Tài khoản nội bộ (đăng nhập web/app nhân viên) và tài khoản hành khách (app đặt vé) quản lý tách biệt. */
export type UserScope = "internal" | "passenger";
/** "ALL" hoặc mã vai trò từ backend (admin có thể tạo vai trò mới). */
export type UserRoleFilter = string;
export type UserStatusFilter = "ALL" | AccountStatus;
export type UserCreateDraft = {
  name: string;
  email: string;
  role: string;
};
export type UserCreateErrors = Partial<Record<"name" | "email", string>>;
