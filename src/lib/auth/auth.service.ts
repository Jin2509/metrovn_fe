import { DEMO_ACCOUNTS } from "@/mocks/accounts";
import { logAction } from "@/mocks/admin";
import type { LoginInput, SessionUser } from "./auth.types";
import { authStore, endSession, startSession, updateSessionUser } from "./session.store";

/**
 * Tầng xác thực GIẢ LẬP. Khi có backend, chỉ cần thay thân `login`/`logout` bằng lệnh gọi API
 * (cookie httpOnly hoặc token) — phần còn lại của app chỉ phụ thuộc vào `session.store`.
 */
export const LOGIN_LATENCY_MS = 600;

export class AuthError extends Error {
  constructor(
    public readonly code: "INVALID_CREDENTIALS" | "WRONG_PASSWORD",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login(
  { email, password, remember }: LoginInput,
  latencyMs = LOGIN_LATENCY_MS,
): Promise<SessionUser> {
  await wait(latencyMs);
  const normalized = email.trim().toLowerCase();
  const account = DEMO_ACCOUNTS.find((a) => a.email === normalized);
  // Thông báo chung cho cả "sai email" và "sai mật khẩu" để không lộ tài khoản nào tồn tại.
  if (!account || account.password !== password)
    throw new AuthError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");

  const { password: _password, ...user } = account;
  startSession(user, remember);
  logAction("Đăng nhập", user.email);
  return user;
}

export function logout() {
  const user = authStore.get().user;
  if (user) logAction("Đăng xuất", user.email);
  endSession("logout");
}

/**
 * Đổi mật khẩu của người đang đăng nhập (GIẢ LẬP: chỉ đổi trong bộ nhớ, tải lại trang sẽ về mặc định).
 * Khi có backend: gọi API đổi mật khẩu, server tự kiểm tra mật khẩu hiện tại.
 */
export function changePassword(currentPassword: string, newPassword: string) {
  const user = authStore.get().user;
  const account = user && DEMO_ACCOUNTS.find((a) => a.id === user.id);
  if (!account || account.password !== currentPassword)
    throw new AuthError("WRONG_PASSWORD", "Mật khẩu hiện tại không đúng");
  account.password = newPassword;
  logAction("Đổi mật khẩu", account.email);
}

/** Sửa các trường hồ sơ được phép (họ tên, số điện thoại). GIẢ LẬP: ghi vào tài khoản demo và phiên. */
export function updateProfile(patch: { name: string; phone: string }) {
  const user = authStore.get().user;
  const account = user && DEMO_ACCOUNTS.find((a) => a.id === user.id);
  if (!account) return;
  account.name = patch.name;
  account.phone = patch.phone || undefined;
  updateSessionUser({ name: patch.name, phone: patch.phone || undefined });
  logAction("Cập nhật hồ sơ", account.email);
}
