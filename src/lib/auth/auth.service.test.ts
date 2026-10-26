import { beforeEach, describe, expect, it } from "vitest";

import { auditStore } from "@/mocks/admin";
import { DEMO_PASSWORD } from "@/mocks/accounts";
import { AuthError, login, logout } from "./auth.service";
import { authStore, hydrateSession } from "./session.store";

const STORAGE_KEY = "metro.session.v1";

function reset() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  hydrateSession();
}

beforeEach(reset);

describe("login", () => {
  it("đăng nhập đúng: lưu phiên (không kèm mật khẩu) và ghi nhật ký", async () => {
    const user = await login(
      { email: " Manager@Metro.vn ", password: DEMO_PASSWORD, remember: true },
      0,
    );

    expect(user).toMatchObject({ role: "MANAGER", name: "Trần Thị Bình" });
    expect(authStore.get()).toMatchObject({ status: "authenticated", user: { role: "MANAGER" } });

    const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
    expect(raw).toContain("manager@metro.vn");
    expect(raw).not.toContain(DEMO_PASSWORD);
    expect(auditStore.get()[0]).toMatchObject({ actor: "Trần Thị Bình", action: "Đăng nhập" });
  });

  it("không chọn ghi nhớ: chỉ lưu trong sessionStorage", async () => {
    await login({ email: "admin@metro.vn", password: DEMO_PASSWORD, remember: false }, 0);

    expect(window.sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("sai mật khẩu hoặc sai email: cùng một thông báo, không tạo phiên", async () => {
    const wrongPassword = login({ email: "admin@metro.vn", password: "sai", remember: true }, 0);
    const wrongEmail = login(
      { email: "nobody@metro.vn", password: DEMO_PASSWORD, remember: true },
      0,
    );

    await expect(wrongPassword).rejects.toBeInstanceOf(AuthError);
    await expect(wrongPassword).rejects.toThrow("Email hoặc mật khẩu không đúng");
    await expect(wrongEmail).rejects.toThrow("Email hoặc mật khẩu không đúng");
    expect(authStore.get().status).toBe("anonymous");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("logout", () => {
  it("xóa phiên ở mọi storage và đánh dấu đăng xuất chủ động", async () => {
    await login({ email: "accountant@metro.vn", password: DEMO_PASSWORD, remember: true }, 0);
    logout();

    expect(authStore.get()).toMatchObject({ status: "anonymous", user: null, endedBy: "logout" });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(auditStore.get()[0]).toMatchObject({ actor: "Lê Minh Châu", action: "Đăng xuất" });
  });
});

describe("hydrateSession", () => {
  const stored = (patch: Record<string, unknown> = {}, userPatch: Record<string, unknown> = {}) =>
    JSON.stringify({
      user: {
        id: "ADM001",
        name: "Nguyễn Văn An",
        email: "admin@metro.vn",
        role: "ADMIN",
        ...userPatch,
      },
      issuedAt: Date.now() - 1000,
      expiresAt: Date.now() + 60_000,
      ...patch,
    });

  it("khôi phục phiên còn hạn", () => {
    window.localStorage.setItem(STORAGE_KEY, stored());
    hydrateSession();
    expect(authStore.get()).toMatchObject({ status: "authenticated", user: { role: "ADMIN" } });
  });

  it("bỏ qua phiên đã hết hạn, vai trò lạ hoặc dữ liệu hỏng", () => {
    for (const raw of [
      stored({ expiresAt: Date.now() - 1 }),
      stored({}, { role: "SUPERUSER" }),
      "{không phải json",
    ]) {
      window.localStorage.setItem(STORAGE_KEY, raw);
      hydrateSession();
      expect(authStore.get().status, raw).toBe("anonymous");
    }
  });
});
