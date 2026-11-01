import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminUser } from "@/lib/api";
import { startSession } from "@/lib/auth/session.store";
import { isInScope } from "@/pages/users/users.constants";
import {
  createUserAccount,
  fetchAllUsers,
  validateUserAccountDraft,
} from "@/pages/users/users.service";

const user = (id: string, roles: string[]): AdminUser => ({
  id,
  email: `${id}@metro.vn`,
  fullName: id,
  status: "ACTIVE",
  roles,
  createdAt: "2026-11-01T11:32:37.644841Z",
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  startSession(
    { id: "1", name: "An", email: "an@metro.vn", role: "ADMIN", permissions: [] },
    {
      accessToken: "a",
      refreshToken: "r",
      refreshTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
    true,
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("fetchAllUsers", () => {
  it("đọc hết các trang, trang bắt đầu từ 0, tối đa 100 bản ghi mỗi trang", async () => {
    fetchMock.mockImplementation(async (url) => {
      const page = Number(new URL(String(url)).searchParams.get("page"));
      return json({
        content: [user(`u${page}`, ["STAFF"])],
        page: { size: 100, number: page, totalElements: 2, totalPages: 2 },
      });
    });

    const users = await fetchAllUsers();

    expect(users.map((u) => u.id)).toEqual(["u0", "u1"]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("page=0&size=100&sort=createdAt%2Cdesc");
  });

  it("không có tài khoản nào: vẫn dừng đúng", async () => {
    fetchMock.mockResolvedValue(
      json({ content: [], page: { size: 100, number: 0, totalElements: 0, totalPages: 0 } }),
    );
    await expect(fetchAllUsers()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("createUserAccount", () => {
  it("chuẩn hoá dữ liệu và không gửi temporaryPassword để hệ thống tự sinh", async () => {
    fetchMock.mockResolvedValue(json(user("u", ["STAFF"]), 201));

    await createUserAccount({ name: " Nhân Viên ", email: " NV@Metro.vn ", role: "STAFF" });

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: "nv@metro.vn",
      fullName: "Nhân Viên",
      roles: ["STAFF"],
    });
  });
});

describe("validateUserAccountDraft", () => {
  it("email không phân biệt hoa thường khi kiểm tra trùng", () => {
    const draft = { name: "Nhân Viên", email: "NV@metro.vn", role: "STAFF" };
    expect(validateUserAccountDraft(draft, ["nv@metro.vn"]).email).toBe("Email đã tồn tại");
    expect(validateUserAccountDraft(draft, [])).toEqual({});
  });
});

describe("isInScope", () => {
  it("chỉ tài khoản toàn vai trò PASSENGER mới thuộc tab hành khách", () => {
    expect(isInScope(user("a", ["PASSENGER"]), "passenger")).toBe(true);
    expect(isInScope(user("b", ["PASSENGER", "STAFF"]), "internal")).toBe(true);
    expect(isInScope(user("c", ["AUDITOR"]), "internal")).toBe(true);
    expect(isInScope(user("c", ["AUDITOR"]), "passenger")).toBe(false);
  });
});
