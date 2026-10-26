import { canAccessRoute, isPublicPath, normalizePath, type Role } from "@/lib/auth";
import type { LoginDraft, LoginErrors } from "@/pages/login/login.types";

export function validateLoginDraft(draft: LoginDraft): LoginErrors {
  const errors: LoginErrors = {};
  if (!draft.email.trim()) errors.email = "Vui lòng nhập email";
  else if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) errors.email = "Email không hợp lệ";
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
