import type { User } from "@/mocks/admin";

/** Tài khoản nội bộ (đăng nhập web/app nhân viên) và tài khoản hành khách (app đặt vé) quản lý tách biệt. */
export type UserScope = "internal" | "passenger";
export type UserRoleFilter = "ALL" | User["role"];
export type UserStatusFilter = "ALL" | User["status"];
export type UserCreateDraft = {
  name: string;
  email: string;
  role: "STAFF" | "ACCOUNTANT";
};
export type UserCreateErrors = Partial<Record<"name" | "email", string>>;
