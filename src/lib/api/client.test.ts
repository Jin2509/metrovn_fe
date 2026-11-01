import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authStore,
  getSessionTokens,
  hydrateSession,
  startSession,
} from "@/lib/auth/session.store";
import { ApiError, apiRequest, setAccessChangedHandler } from "./index";

// Hạn 14 ngày như backend, với 6 chữ số lẻ của giây (vd. 2026-11-15T11:32:36.696621Z).
const FUTURE = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().replace("Z", "621Z");

const tokens = (n: number) => ({
  accessToken: `access-${n}`,
  tokenType: "Bearer",
  expiresAt: FUTURE,
  refreshToken: `refresh-${n}`,
  refreshTokenExpiresAt: FUTURE,
});

const json = (status: number, body?: unknown, headers?: Record<string, string>) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers });

const fetchMock = vi.fn<typeof fetch>();
const pathOf = (url: unknown) => new URL(String(url)).pathname;
const refreshCalls = () =>
  fetchMock.mock.calls.filter(([url]) => pathOf(url) === "/api/auth/refresh");
const authHeader = (init?: RequestInit) => (init?.headers as Record<string, string>).Authorization;

/** Backend giả: chỉ nhận `access-2`; `refresh` trả theo `onRefresh`. */
function backend(onRefresh: () => Response | Promise<Response>) {
  fetchMock.mockImplementation(async (url, init) => {
    if (pathOf(url) === "/api/auth/refresh") return onRefresh();
    return authHeader(init) === "Bearer access-2" ? json(200, { ok: true }) : json(401);
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  hydrateSession();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  startSession(
    { id: "1", name: "An", email: "an@metro.vn", role: "ADMIN", permissions: [] },
    tokens(1),
    true,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  setAccessChangedHandler(undefined);
});

describe("apiRequest", () => {
  it("gắn token, gửi JSON, không gửi credentials, bỏ tham số rỗng", async () => {
    fetchMock.mockResolvedValue(json(200, { a: 1 }));

    const result = await apiRequest("/api/x", {
      method: "POST",
      body: { b: 2 },
      query: { q: "an", status: undefined, empty: "", page: 0 },
    });

    expect(result).toEqual({ a: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:8080/api/x?q=an&page=0");
    expect(init?.credentials).toBeUndefined();
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer access-1",
    });
  });

  it("204 không có body", async () => {
    fetchMock.mockResolvedValue(json(204));
    await expect(apiRequest("/api/x")).resolves.toBeUndefined();
  });

  it("đọc problem+json: detail, errors và Retry-After", async () => {
    fetchMock.mockResolvedValue(
      json(
        429,
        { detail: "Chờ chút", errors: { email: "bad" } },
        {
          "Retry-After": "42",
        },
      ),
    );

    const error = (await apiRequest("/api/x").catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 429,
      message: "Chờ chút",
      fieldErrors: { email: "bad" },
      retryAfter: 42,
    });
  });

  it("403 body rỗng: không vỡ khi parse, không gọi refresh, báo quyền có thể đã đổi", async () => {
    const onChanged = vi.fn();
    setAccessChangedHandler(onChanged);
    fetchMock.mockResolvedValue(json(403));

    await expect(apiRequest("/api/x")).rejects.toMatchObject({
      status: 403,
      message: "Bạn không có quyền thực hiện thao tác này",
    });
    expect(refreshCalls()).toHaveLength(0);
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("chưa đăng nhập: không gửi request", async () => {
    window.localStorage.clear();
    await expect(apiRequest("/api/x")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("auth:false: 401 không kích hoạt refresh", async () => {
    fetchMock.mockResolvedValue(json(401, { detail: "Sai" }));
    await expect(apiRequest("/api/auth/login", { auth: false })).rejects.toMatchObject({
      status: 401,
    });
    expect(refreshCalls()).toHaveLength(0);
  });

  it("mất mạng: ApiError status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiRequest("/api/x")).rejects.toMatchObject({ status: 0 });
  });
});

describe("refresh token", () => {
  it("401 → refresh, lưu cả hai token mới, gọi lại request đúng 1 lần", async () => {
    const onChanged = vi.fn();
    setAccessChangedHandler(onChanged);
    backend(() => json(200, tokens(2)));

    await expect(apiRequest("/api/x")).resolves.toEqual({ ok: true });

    expect(getSessionTokens()).toEqual({ accessToken: "access-2", refreshToken: "refresh-2" });
    expect(JSON.parse(String(refreshCalls()[0][1]?.body))).toEqual({ refreshToken: "refresh-1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("nhiều request cùng bị 401: chỉ có một request refresh", async () => {
    backend(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return json(200, tokens(2));
    });

    const results = await Promise.all([
      apiRequest("/api/a"),
      apiRequest("/api/b"),
      apiRequest("/api/c"),
    ]);

    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshCalls()).toHaveLength(1);
  });

  it("request trả 401 sau khi đã có token mới: không refresh lại", async () => {
    let releaseSlow = (_: Response) => {};
    fetchMock.mockImplementation(async (url, init) => {
      if (pathOf(url) === "/api/auth/refresh") return json(200, tokens(2));
      if (pathOf(url) === "/api/slow" && authHeader(init) === "Bearer access-1")
        return new Promise<Response>((resolve) => (releaseSlow = resolve));
      return authHeader(init) === "Bearer access-2" ? json(200, { ok: true }) : json(401);
    });

    const slow = apiRequest("/api/slow");
    await apiRequest("/api/fast");
    releaseSlow(json(401));

    await expect(slow).resolves.toEqual({ ok: true });
    expect(refreshCalls()).toHaveLength(1);
  });

  it("tab khác vừa refresh trong lúc chờ lock: dùng token đó, không gửi refresh", async () => {
    vi.stubGlobal("navigator", {
      locks: {
        request: async (_name: string, task: () => Promise<unknown>) => {
          // Mô phỏng tab khác giữ lock, refresh xong rồi lưu token mới.
          startSession(authStore.get().user!, tokens(2), true);
          return task();
        },
      },
    });
    backend(() => json(500));

    await expect(apiRequest("/api/x")).resolves.toEqual({ ok: true });
    expect(refreshCalls()).toHaveLength(0);
  });

  it.each([401, 403])("refresh trả %i: xoá token và kết thúc phiên", async (status) => {
    backend(() => json(status));

    await expect(apiRequest("/api/x")).rejects.toMatchObject({ status });
    expect(getSessionTokens()).toBeNull();
    expect(authStore.get()).toMatchObject({ status: "anonymous", endedBy: "expired" });
  });

  it("refresh gặp 5xx: giữ token, chưa đăng xuất", async () => {
    backend(() => json(503));

    await expect(apiRequest("/api/x")).rejects.toMatchObject({ status: 503 });
    expect(getSessionTokens()?.refreshToken).toBe("refresh-1");
    expect(authStore.get().status).toBe("authenticated");
  });

  it("refresh mất mạng: giữ token, chưa đăng xuất", async () => {
    fetchMock.mockImplementation(async (url) => {
      if (pathOf(url) === "/api/auth/refresh") throw new TypeError("Failed to fetch");
      return json(401);
    });

    await expect(apiRequest("/api/x")).rejects.toMatchObject({ status: 0 });
    expect(getSessionTokens()?.refreshToken).toBe("refresh-1");
  });

  it("token mới vẫn bị 401: không lặp refresh", async () => {
    fetchMock.mockImplementation(async (url) =>
      pathOf(url) === "/api/auth/refresh" ? json(200, tokens(2)) : json(401),
    );

    await expect(apiRequest("/api/x")).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls()).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
