import { addDays, format, parseISO } from "date-fns";
import type { AuditLog, AuthEventType } from "@/lib/api";

export const AUDIT_ACTION_LABELS: Record<AuthEventType, string> = {
  LOGIN_SUCCESS: "Đăng nhập",
  LOGIN_FAILED: "Đăng nhập sai mật khẩu",
  LOGOUT: "Đăng xuất",
  TOKEN_REUSE_DETECTED: "Phát hiện dùng lại token",
  EMAIL_VERIFIED: "Xác thực email",
  EMAIL_CHANGED: "Đổi email",
  PASSWORD_CHANGED: "Đổi mật khẩu",
  PASSWORD_RESET: "Đặt lại mật khẩu qua email",
  ACCOUNT_CREATED_BY_ADMIN: "Admin tạo tài khoản",
  PASSWORD_RESET_BY_ADMIN: "Admin đặt lại mật khẩu",
  ROLES_CHANGED: "Đổi vai trò",
  ACCOUNT_LOCKED: "Khoá tài khoản",
  ACCOUNT_ACTIVATED: "Mở khoá tài khoản",
};

export const AUDIT_ACTIONS = Object.keys(AUDIT_ACTION_LABELS) as AuthEventType[];

/** Sự kiện chắc chắn do chính chủ làm. Sai mật khẩu hay dùng lại token thì không biết là ai. */
const SELF_ACTIONS: readonly string[] = [
  "LOGIN_SUCCESS",
  "LOGOUT",
  "EMAIL_VERIFIED",
  "EMAIL_CHANGED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
];

/** Backend có thể thêm `type` mới: hiện nguyên mã thay vì để trống. */
export function auditActionLabel(type: string) {
  return AUDIT_ACTION_LABELS[type as AuthEventType] ?? type;
}

export function auditActorName(log: AuditLog) {
  if (log.actor) return log.actor.fullName;
  return SELF_ACTIONS.includes(log.type) && log.user ? log.user.fullName : "Không xác định";
}

export function formatAuditTime(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy HH:mm:ss");
}

/** Khoảng thời gian của một ngày theo giờ máy người dùng; `to` là đầu ngày hôm sau (không tính). */
export function auditDayRange(day: string) {
  if (!day) return {};
  const start = parseISO(day);
  return { from: start.toISOString(), to: addDays(start, 1).toISOString() };
}
