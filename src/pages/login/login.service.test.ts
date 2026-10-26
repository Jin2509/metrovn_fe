import { describe, expect, it } from "vitest";

import { resolveRedirectTarget, validateLoginDraft } from "@/pages/login/login.service";

describe("validateLoginDraft", () => {
  it("báo lỗi khi thiếu hoặc sai định dạng", () => {
    expect(validateLoginDraft({ email: "", password: "", remember: true })).toEqual({
      email: "Vui lòng nhập email",
      password: "Vui lòng nhập mật khẩu",
    });
    expect(validateLoginDraft({ email: "abc", password: "x", remember: true }).email).toBe(
      "Email không hợp lệ",
    );
  });

  it("hợp lệ thì không có lỗi", () => {
    expect(validateLoginDraft({ email: "admin@metro.vn", password: "x", remember: false })).toEqual(
      {},
    );
  });
});

describe("resolveRedirectTarget", () => {
  it("quay lại trang đang xem nếu vai trò được phép", () => {
    expect(resolveRedirectTarget("/users", "ADMIN")).toBe("/users");
    expect(resolveRedirectTarget("/revenue?from=2026-10-01", "MANAGER")).toBe(
      "/revenue?from=2026-10-01",
    );
  });

  it("về trang tổng quan nếu vai trò không đủ quyền", () => {
    expect(resolveRedirectTarget("/users", "MANAGER")).toBe("/");
    expect(resolveRedirectTarget("/approvals", "ACCOUNTANT")).toBe("/");
  });

  it("chặn open-redirect và đường dẫn không hợp lệ", () => {
    for (const bad of [
      undefined,
      "",
      "users",
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "/login",
    ])
      expect(resolveRedirectTarget(bad, "ADMIN"), String(bad)).toBe("/");
  });
});
