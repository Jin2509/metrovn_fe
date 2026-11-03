import { ApiError, NETWORK_ERROR_STATUS, authApi, meApi, type MeResponse } from "@/lib/api";
import { logAction } from "@/mocks/admin";
import { ROLES } from "./permissions";
import type { LoginInput, Role, SessionTokens, SessionUser } from "./auth.types";
import {
  authStore,
  endSession,
  expireSession,
  getSessionTokens,
  startSession,
  updateSessionUser,
} from "./session.store";

export class AuthError extends Error {
  constructor(
    public readonly code:
      | "INVALID_CREDENTIALS"
      | "EMAIL_NOT_VERIFIED"
      | "ACCOUNT_LOCKED"
      | "NO_WEB_ACCESS"
      | "TOO_MANY_ATTEMPTS"
      | "WRONG_PASSWORD"
      | "INVALID_NEW_PASSWORD"
      | "INVALID_RESET_CODE"
      | "RESET_CODE_LOCKED"
      | "NETWORK",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const NETWORK_MESSAGE = "Không thể kết nối tới máy chủ, vui lòng thử lại";
const TOO_MANY_ATTEMPTS_MESSAGE = "Nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút";

/**
 * Vai trò web của một tài khoản. Web chỉ phục vụ Admin, Manager và Kế toán; `ROLES` xếp theo thứ tự
 * ưu tiên nếu có nhiều vai trò. Không có vai trò nào khớp (hành khách, nhân viên soát vé) → null.
 */
export function resolveRole(roles: string[]): Role | null {
  return ROLES.find((role) => roles.includes(role)) ?? null;
}

function toSessionUser(me: MeResponse): SessionUser | null {
  const role = resolveRole(me.roles);
  return (
    role && { id: me.id, name: me.fullName, email: me.email, role, permissions: me.permissions }
  );
}

function revokeTokens({ refreshToken, accessToken }: SessionTokens) {
  authApi.logout(refreshToken, accessToken).catch(() => {
    /* token ở máy đã xoá; phía server tự hết hạn */
  });
}

/** Hai trường hợp 403 khi đăng nhập hiện chỉ phân biệt được bằng chuỗi `detail`. */
function toLoginError(error: unknown) {
  if (!(error instanceof ApiError)) return error;
  if (error.status === 401)
    return new AuthError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
  if (error.status === 403 && error.detail === "Email chưa được xác thực")
    return new AuthError(
      "EMAIL_NOT_VERIFIED",
      "Email chưa được xác thực, vui lòng liên hệ quản trị viên",
    );
  if (error.status === 403)
    return new AuthError("ACCOUNT_LOCKED", "Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên");
  if (error.status === 429) return new AuthError("TOO_MANY_ATTEMPTS", TOO_MANY_ATTEMPTS_MESSAGE);
  if (error.status === NETWORK_ERROR_STATUS) return new AuthError("NETWORK", NETWORK_MESSAGE);
  return error;
}

export async function login({ email, password, remember }: LoginInput): Promise<SessionUser> {
  try {
    const tokens = await authApi.login({ email: email.trim().toLowerCase(), password });
    const user = toSessionUser(await meApi.get(tokens.accessToken));
    if (!user) {
      revokeTokens(tokens);
      throw new AuthError("NO_WEB_ACCESS", "Tài khoản này không có quyền truy cập trang quản trị");
    }
    startSession(user, tokens, remember);
    logAction("Đăng nhập", user.email);
    return user;
  } catch (error) {
    throw toLoginError(error);
  }
}

/** Xoá token ở máy ngay, không chờ server: request lỗi vẫn coi như đã đăng xuất. */
export function logout() {
  const user = authStore.get().user;
  const tokens = getSessionTokens();
  if (user) logAction("Đăng xuất", user.email);
  endSession("logout");
  if (tokens) revokeTokens(tokens);
}

let syncing: Promise<void> | null = null;

/**
 * Tải lại thông tin và quyền từ `GET /api/me`. Lỗi mạng/5xx thì giữ dữ liệu đang có;
 * 401 không cứu được thì `apiRequest` đã kết thúc phiên.
 */
export function syncCurrentUser(): Promise<void> {
  syncing ??= (async () => {
    if (!getSessionTokens()) return;
    const me = await meApi.get();
    const user = toSessionUser(me);
    if (user) updateSessionUser(user);
    else {
      const tokens = getSessionTokens();
      expireSession();
      if (tokens) revokeTokens(tokens);
    }
  })()
    .catch(() => {})
    .finally(() => {
      syncing = null;
    });
  return syncing;
}

/** Thành công: backend thu hồi token trên mọi thiết bị nên phiên này cũng kết thúc. */
export async function changePassword(currentPassword: string, newPassword: string) {
  const email = authStore.get().user?.email ?? "";
  try {
    await meApi.changePassword({ currentPassword, newPassword });
  } catch (error) {
    if (error instanceof ApiError && error.status === 400)
      throw error.fieldErrors.newPassword
        ? new AuthError("INVALID_NEW_PASSWORD", "Mật khẩu mới không hợp lệ")
        : new AuthError("WRONG_PASSWORD", "Mật khẩu hiện tại không đúng");
    if (error instanceof ApiError && error.status === 429)
      throw new AuthError("TOO_MANY_ATTEMPTS", TOO_MANY_ATTEMPTS_MESSAGE);
    throw error;
  }
  logAction("Đổi mật khẩu", email);
  endSession("logout");
}

/**
 * Gửi mã đặt lại mật khẩu. Backend trả 202 kể cả khi email không tồn tại, nên không báo được mã
 * có được gửi hay không. 429: vừa gửi mã xong, mã cũ vẫn dùng được; trả về số giây phải chờ.
 */
export async function requestPasswordReset(email: string): Promise<{ retryAfter?: number }> {
  try {
    await authApi.forgotPassword(email.trim().toLowerCase());
    return {};
  } catch (error) {
    if (error instanceof ApiError && error.status === 429)
      return { retryAfter: error.retryAfter ?? 60 };
    throw error;
  }
}

/** Thành công: backend thu hồi token trên mọi thiết bị, người dùng đăng nhập lại bằng mật khẩu mới. */
export async function resetPassword(input: { email: string; code: string; newPassword: string }) {
  try {
    await authApi.resetPassword({ ...input, email: input.email.trim().toLowerCase() });
  } catch (error) {
    if (error instanceof ApiError && error.status === 400)
      throw error.fieldErrors.newPassword
        ? new AuthError("INVALID_NEW_PASSWORD", "Mật khẩu mới không hợp lệ")
        : new AuthError(
            "INVALID_RESET_CODE",
            error.fieldErrors.code
              ? "Mã xác thực gồm 6 chữ số"
              : error.detail || "Mã xác thực không đúng hoặc đã hết hạn",
          );
    if (error instanceof ApiError && error.status === 429)
      throw new AuthError(
        "RESET_CODE_LOCKED",
        "Nhập sai mã quá nhiều lần, vui lòng yêu cầu mã mới",
      );
    throw error;
  }
}

/** Đổi họ tên. Backend chưa có số điện thoại; đổi email cần thêm màn nhập OTP. */
export async function updateProfile(patch: { name: string }) {
  const user = toSessionUser(await meApi.updateProfile({ fullName: patch.name }));
  if (user) updateSessionUser(user);
  logAction("Cập nhật hồ sơ", authStore.get().user?.email ?? "");
}
