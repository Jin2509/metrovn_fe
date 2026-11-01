import { apiRequest } from "./client";
import type {
  AccountStatus,
  AdminUser,
  AuditLog,
  AuditLogQuery,
  Page,
  PermissionResponse,
  RoleResponse,
  UserListQuery,
} from "./types";

const usersPath = (id: string, action?: string) =>
  `/api/admin/users/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;

// /api/admin/users: xem cần USER_VIEW, thay đổi cần USER_MANAGE.
export const adminUsersApi = {
  list: (query: UserListQuery = {}) => apiRequest<Page<AdminUser>>("/api/admin/users", { query }),
  get: (id: string) => apiRequest<AdminUser>(usersPath(id)),
  /** Bỏ `temporaryPassword` thì hệ thống tự sinh; mật khẩu được gửi qua email. */
  create: (body: {
    email: string;
    fullName: string;
    roles: string[];
    temporaryPassword?: string;
  }) => apiRequest<AdminUser>("/api/admin/users", { method: "POST", body }),
  /** `roles` thay thế toàn bộ vai trò hiện có và không được rỗng. */
  setRoles: (id: string, roles: string[]) =>
    apiRequest<AdminUser>(usersPath(id, "roles"), { method: "PUT", body: { roles } }),
  setStatus: (id: string, status: Exclude<AccountStatus, "PENDING_VERIFICATION">) =>
    apiRequest<AdminUser>(usersPath(id, "status"), { method: "PATCH", body: { status } }),
  resetPassword: (id: string, newPassword: string) =>
    apiRequest(usersPath(id, "password"), { method: "PUT", body: { newPassword } }),
};

// /api/admin/auth-events: cần USER_VIEW. Luôn mới nhất trước.
export const adminAuditApi = {
  list: (query: AuditLogQuery = {}) =>
    apiRequest<Page<AuditLog>>("/api/admin/auth-events", { query }),
};

// /api/admin/roles, /api/admin/permissions: cần RBAC_MANAGE.
export const adminRbacApi = {
  listRoles: () => apiRequest<RoleResponse[]>("/api/admin/roles"),
  listPermissions: () => apiRequest<PermissionResponse[]>("/api/admin/permissions"),
  createRole: (body: { code: string; name: string; permissions: string[] }) =>
    apiRequest<RoleResponse>("/api/admin/roles", { method: "POST", body }),
  /** `permissions` thay thế toàn bộ quyền hiện có và có hiệu lực ngay. */
  setRolePermissions: (code: string, permissions: string[]) =>
    apiRequest<RoleResponse>(`/api/admin/roles/${encodeURIComponent(code)}/permissions`, {
      method: "PUT",
      body: { permissions },
    }),
};
