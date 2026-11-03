import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auditStore } from "@/mocks/admin";
import {
  AuthError,
  changePassword,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  resolveRole,
  syncCurrentUser,
  updateProfile,
} from "./auth.service";
import { authStore, hydrateSession } from "./session.store";

const STORAGE_KEY = "metro.session.v1";
// Hạn 14 ngày như backend, với 6 chữ số lẻ của giây (vd. 2026-11-15T11:32:36.696621Z).
const FUTURE = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().replace("Z", "621Z");

const TOKENS = {
  accessToken: "access-1",
  tokenType: "Bearer",
  expiresAt: FUTURE,
  refreshToken: "refresh-1",
  refreshTokenExpiresAt: FUTURE,
};

const me = (patch: Record<string, unknown> = {}) => ({
  id: "158c41a0",
  email: "manager@metro.vn",
  fullName: "Trần Thị Bình",
  status: "ACTIVE",
  roles: ["MANAGER"],
  permissions: ["REPORT_VIEW"],
  ...patch,
});

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const fetchMock = vi.fn<typeof fetch>();

/** Trả lời theo đường dẫn; mặc định 204. */
function route(handlers: Record<string, (init?: RequestInit) => Response>) {
  fetchMock.mockImplementation(async (url, init) => {
    const path = new URL(String(url)).pathname;
    return handlers[path]?.(init) ?? json(204);
  });
}

const calledPaths = () => fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname);

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  hydrateSession();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const loginOk = (patch?: Record<string, unknown>) =>
  route({
    "/api/auth/login": () => json(200, TOKENS),
    "/api/me": () => json(200, me(patch)),
  });

const input = { email: " Manager@Metro.vn ", password: "Metro@2026", remember: true };

describe("resolveRole", () => {
  it("chọn vai trò web theo thứ tự ưu tiên, không có thì null", () => {
    expect(resolveRole(["ACCOUNTANT", "ADMIN"])).toBe("ADMIN");
    expect(resolveRole(["STAFF", "MANAGER"])).toBe("MANAGER");
    expect(resolveRole(["PASSENGER"])).toBeNull();
  });
});

describe("login", () => {
  it("đăng nhập đúng: chuẩn hoá email, lưu phiên kèm token, không lưu mật khẩu", async () => {
    loginOk();
    const user = await login(input);

    expect(user).toMatchObject({ role: "MANAGER", name: "Trần Thị Bình" });
    expect(authStore.get()).toMatchObject({ status: "authenticated", user: { role: "MANAGER" } });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: "manager@metro.vn",
      password: "Metro@2026",
    });
    const headers = fetchMock.mock.calls[1][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer access-1");

    const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
    expect(JSON.parse(raw)).toMatchObject({ accessToken: "access-1", refreshToken: "refresh-1" });
    expect(raw).not.toContain("Metro@2026");
    expect(JSON.parse(raw).expiresAt).toBeGreaterThan(Date.now() + 13 * 24 * 3600 * 1000);
    expect(auditStore.get()[0]).toMatchObject({ actor: "Trần Thị Bình", action: "Đăng nhập" });
  });

  it("không chọn ghi nhớ: chỉ lưu trong sessionStorage", async () => {
    loginOk();
    await login({ ...input, remember: false });

    expect(window.sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it.each([
    [401, "Email hoặc mật khẩu không đúng", "INVALID_CREDENTIALS"],
    [403, "Email chưa được xác thực", "EMAIL_NOT_VERIFIED"],
    [403, "Tài khoản đã bị khoá", "ACCOUNT_LOCKED"],
    [429, "Nhập sai quá nhiều lần", "TOO_MANY_ATTEMPTS"],
  ])("lỗi %i (%s) không tạo phiên", async (status, detail, code) => {
    route({ "/api/auth/login": () => json(status, { detail, status }) });

    const error = await login(input).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).code).toBe(code);
    expect(authStore.get().status).toBe("anonymous");
    expect(calledPaths()).toEqual(["/api/auth/login"]);
  });

  it("mất mạng: báo lỗi kết nối", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(login(input)).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("tài khoản không có vai trò web: từ chối và thu hồi token vừa cấp", async () => {
    loginOk({ roles: ["PASSENGER"] });

    await expect(login(input)).rejects.toMatchObject({ code: "NO_WEB_ACCESS" });
    expect(authStore.get().status).toBe("anonymous");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(calledPaths()).toContain("/api/auth/logout");
  });
});

describe("logout", () => {
  it("xoá phiên ngay và gửi cả hai token lên server", async () => {
    loginOk();
    await login(input);
    logout();

    expect(authStore.get()).toMatchObject({ status: "anonymous", user: null, endedBy: "logout" });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(auditStore.get()[0]).toMatchObject({ action: "Đăng xuất" });
    const [, init] = fetchMock.mock.calls.at(-1)!;
    expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: "refresh-1" });
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer access-1");
  });

  it("mất mạng vẫn đăng xuất ở máy", async () => {
    loginOk();
    await login(input);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    logout();
    await Promise.resolve();
    expect(authStore.get().status).toBe("anonymous");
  });
});

describe("syncCurrentUser", () => {
  it("cập nhật quyền mới từ /api/me", async () => {
    loginOk();
    await login(input);
    route({ "/api/me": () => json(200, me({ permissions: ["USER_VIEW"] })) });

    await syncCurrentUser();
    expect(authStore.get().user?.permissions).toEqual(["USER_VIEW"]);
  });

  it("mất mạng: giữ nguyên phiên", async () => {
    loginOk();
    await login(input);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await syncCurrentUser();
    expect(authStore.get().status).toBe("authenticated");
  });

  it("mất vai trò web: kết thúc phiên", async () => {
    loginOk();
    await login(input);
    route({ "/api/me": () => json(200, me({ roles: ["PASSENGER"] })) });

    await syncCurrentUser();
    expect(authStore.get()).toMatchObject({ status: "anonymous", endedBy: "expired" });
  });
});

describe("changePassword", () => {
  beforeEach(async () => {
    loginOk();
    await login(input);
  });

  it("thành công: kết thúc phiên vì mọi token đã bị thu hồi", async () => {
    await changePassword("Metro@2026", "MatKhauMoi@456");
    expect(authStore.get().status).toBe("anonymous");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("sai mật khẩu hiện tại (400): giữ phiên và không gọi refresh", async () => {
    route({ "/api/me/password": () => json(400, { detail: "Mật khẩu hiện tại không đúng" }) });

    await expect(changePassword("sai", "MatKhauMoi@456")).rejects.toMatchObject({
      code: "WRONG_PASSWORD",
    });
    expect(authStore.get().status).toBe("authenticated");
    expect(calledPaths()).not.toContain("/api/auth/refresh");
  });

  it("mật khẩu mới bị backend từ chối: báo đúng field", async () => {
    route({ "/api/me/password": () => json(400, { errors: { newPassword: "too long" } }) });

    await expect(changePassword("Metro@2026", "x")).rejects.toMatchObject({
      code: "INVALID_NEW_PASSWORD",
    });
  });
});

describe("updateProfile", () => {
  it("gửi fullName và cập nhật phiên từ response", async () => {
    loginOk();
    await login(input);
    route({ "/api/me/profile": () => json(200, me({ fullName: "Tên Mới" })) });

    await updateProfile({ name: "Tên Mới" });
    expect(authStore.get().user?.name).toBe("Tên Mới");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "")).toMatchObject({
      user: { name: "Tên Mới" },
    });
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
        permissions: [],
        ...userPatch,
      },
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 60_000,
      ...patch,
    });

  it("khôi phục phiên còn hạn", () => {
    window.localStorage.setItem(STORAGE_KEY, stored());
    hydrateSession();
    expect(authStore.get()).toMatchObject({ status: "authenticated", user: { role: "ADMIN" } });
  });

  it("bỏ qua phiên hết hạn, vai trò lạ, thiếu token (phiên demo cũ) hoặc dữ liệu hỏng", () => {
    for (const raw of [
      stored({ expiresAt: Date.now() - 1 }),
      stored({}, { role: "SUPERUSER" }),
      stored({ accessToken: undefined }),
      "{không phải json",
    ]) {
      window.localStorage.setItem(STORAGE_KEY, raw);
      hydrateSession();
      expect(authStore.get().status, raw).toBe("anonymous");
    }
  });
});

describe("requestPasswordReset", () => {
  it("gửi email đã chuẩn hoá", async () => {
    let body: unknown;
    route({
      "/api/auth/forgot-password": (init) => {
        body = JSON.parse(String(init?.body));
        return json(202);
      },
    });

    await expect(requestPasswordReset(" An@Metro.vn ")).resolves.toEqual({});
    expect(body).toEqual({ email: "an@metro.vn" });
  });

  it("429: trả về số giây phải chờ thay vì báo lỗi", async () => {
    route({
      "/api/auth/forgot-password": () =>
        new Response(null, { status: 429, headers: { "Retry-After": "42" } }),
    });

    await expect(requestPasswordReset("an@metro.vn")).resolves.toEqual({ retryAfter: 42 });
  });

  it("429 không có Retry-After: vẫn phải chờ, không coi là đã gửi", async () => {
    route({ "/api/auth/forgot-password": () => json(429) });

    await expect(requestPasswordReset("an@metro.vn")).resolves.toEqual({ retryAfter: 60 });
  });

  it("lỗi khác vẫn được ném ra", async () => {
    route({ "/api/auth/forgot-password": () => json(500) });

    await expect(requestPasswordReset("an@metro.vn")).rejects.toMatchObject({ status: 500 });
  });
});

describe("resetPassword", () => {
  const reset = { email: " An@Metro.vn ", code: "012345", newPassword: "MatKhau123" };
  const failWith = (status: number, body?: unknown) =>
    route({ "/api/auth/reset-password": () => json(status, body) });

  it("gửi đúng body, giữ số 0 đầu của mã", async () => {
    let body: unknown;
    route({
      "/api/auth/reset-password": (init) => {
        body = JSON.parse(String(init?.body));
        return json(204);
      },
    });

    await resetPassword(reset);
    expect(body).toEqual({ email: "an@metro.vn", code: "012345", newPassword: "MatKhau123" });
  });

  it("400 sai mã: hiện nội dung từ backend", async () => {
    failWith(400, { detail: "Mã đã hết hạn, vui lòng yêu cầu mã mới" });

    await expect(resetPassword(reset)).rejects.toMatchObject({
      code: "INVALID_RESET_CODE",
      message: "Mã đã hết hạn, vui lòng yêu cầu mã mới",
    });
  });

  it("400 theo field: không hiện nội dung chung của backend", async () => {
    failWith(400, { detail: "Dữ liệu không hợp lệ", errors: { newPassword: "too short" } });
    await expect(resetPassword(reset)).rejects.toMatchObject({ code: "INVALID_NEW_PASSWORD" });

    failWith(400, { detail: "Dữ liệu không hợp lệ", errors: { code: "bad" } });
    await expect(resetPassword(reset)).rejects.toMatchObject({
      code: "INVALID_RESET_CODE",
      message: "Mã xác thực gồm 6 chữ số",
    });
  });

  it("429: mã bị khoá, phải yêu cầu mã mới", async () => {
    failWith(429);

    await expect(resetPassword(reset)).rejects.toMatchObject({ code: "RESET_CODE_LOCKED" });
  });
});
