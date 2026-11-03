import { canAccessRoute, isPublicPath, normalizePath, type Role } from "@/lib/auth";
import type { LoginDraft, LoginErrors } from "@/pages/login/login.types";

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Vui lòng nhập email";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Email không hợp lệ";
}

export function validateLoginDraft(draft: LoginDraft): LoginErrors {
  const errors: LoginErrors = {};
  const emailError = validateEmail(draft.email);
  if (emailError) errors.email = emailError;
  if (!draft.password) errors.password = "Vui lòng nhập mật khẩu";
  return errors;
}

/**
 * Trang đích sau khi đăng nhập: quay lại trang đang xem nếu đó là đường dẫn nội bộ
 * mà vai trò được phép mở, ngược lại về trang tổng quan. Chặn open-redirect (//host, \host).
 */
export function resolveRedirectTarget(redirect: string | undefined, role: Role): string {
  if (
    !redirect ||
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("\\")
  )
    return "/";
  const path = normalizePath(redirect);
  if (isPublicPath(path)) return "/";
  return canAccessRoute(role, path) ? redirect : "/";
}
