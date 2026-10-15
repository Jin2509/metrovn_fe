import type { User } from "@/mocks/admin";

export type UserRoleFilter = "ALL" | User["role"];
export type UserStatusFilter = "ALL" | User["status"];
export type UserCreateDraft = {
  name: string;
  email: string;
  role: "STAFF" | "ACCOUNTANT";
};
export type UserCreateErrors = Partial<Record<"name" | "email", string>>;
