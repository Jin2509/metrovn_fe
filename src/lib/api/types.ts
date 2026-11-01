// Kiểu dữ liệu theo tài liệu API backend. Client bỏ qua các field lạ trong response.

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "LOCKED";

export type MeResponse = {
  id: string;
  email: string;
  fullName: string;
  status: AccountStatus;
  roles: string[];
  permissions: string[];
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  status: AccountStatus;
  roles: string[];
  createdAt: string;
};

export type Page<T> = {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};

export type UserListQuery = {
  q?: string;
  status?: AccountStatus;
  /** Bắt đầu từ 0. */
  page?: number;
  /** Tối đa 100. */
  size?: number;
  /** `email`, `fullName`, `status` hoặc `createdAt`, kèm `,asc` hoặc `,desc`. */
  sort?: string;
};

/** Backend có thể thêm mã mới, nên `AuditLog.type` vẫn là string. */
export type AuthEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "TOKEN_REUSE_DETECTED"
  | "EMAIL_VERIFIED"
  | "EMAIL_CHANGED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "ACCOUNT_CREATED_BY_ADMIN"
  | "PASSWORD_RESET_BY_ADMIN"
  | "ROLES_CHANGED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_ACTIVATED";

export type AccountRef = { id: string; email: string; fullName: string };

export type AuditLog = {
  id: string;
  type: string;
  user: AccountRef | null;
  /** null: chính chủ thực hiện, hoặc tài khoản admin đó đã bị xoá. */
  actor: AccountRef | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AuditLogQuery = {
  q?: string;
  type?: AuthEventType;
  /** ISO-8601. Lấy từ `from` đến trước `to`. */
  from?: string;
  to?: string;
  /** Bắt đầu từ 0. */
  page?: number;
  /** Tối đa 100. */
  size?: number;
};

export type NotificationItem = {
  id: string;
  /** SYSTEM, SECURITY, ANNOUNCEMENT. Backend có thể thêm mã mới. */
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListQuery = {
  /** Bắt đầu từ 0. */
  page?: number;
  /** Tối đa 100. */
  size?: number;
};

/** Chọn đúng một trong hai: `all` hoặc `userIds` (tối đa 1000). */
export type SendNotificationBody = { title: string; body: string } & (
  | { all: true }
  | { userIds: string[] }
);

export type RoleResponse = {
  code: string;
  name: string;
  system: boolean;
  permissions: string[];
};

export type PermissionResponse = {
  code: string;
  description: string;
};
