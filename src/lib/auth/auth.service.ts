import { DEMO_ACCOUNTS } from "@/mocks/accounts";
import { logAction } from "@/mocks/admin";
import type { LoginInput, SessionUser } from "./auth.types";
import { authStore, endSession, startSession } from "./session.store";

/**
 * Tầng xác thực GIẢ LẬP. Khi có backend, chỉ cần thay thân `login`/`logout` bằng lệnh gọi API
 * (cookie httpOnly hoặc token) — phần còn lại của app chỉ phụ thuộc vào `session.store`.
 */
export const LOGIN_LATENCY_MS = 600;

export class AuthError extends Error {
  constructor(
    public readonly code: "INVALID_CREDENTIALS",
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
