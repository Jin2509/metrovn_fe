import { describe, expect, it } from "vitest";

import {
  isValidNewPassword,
  validatePasswordChange,
  validateProfile,
} from "@/pages/profile/profile.service";

const CURRENT = "Metro@2026";

describe("validatePasswordChange", () => {
  it("yêu cầu mật khẩu đủ mạnh, khác mật khẩu cũ và nhập lại khớp", () => {
    expect(validatePasswordChange({ current: "", next: "abc", confirm: "abd" })).toEqual({
      current: "Nhập mật khẩu hiện tại",
      next: "Mật khẩu mới cần ít nhất 8 ký tự, có cả chữ và số",
      confirm: "Mật khẩu nhập lại không khớp",
    });
    expect(
      validatePasswordChange({
        current: CURRENT,
        next: CURRENT,
        confirm: CURRENT,
      }).next,
    ).toBe("Mật khẩu mới phải khác mật khẩu hiện tại");
    expect(
      validatePasswordChange({ current: CURRENT, next: "metro2027", confirm: "metro2027" }),
    ).toEqual({});
  });

  it("chặn mật khẩu vượt 72 byte dù chưa tới 72 ký tự", () => {
    const next = "Mậtkhẩu1".repeat(9);
    expect(next.length).toBeLessThanOrEqual(72);
    expect(isValidNewPassword(next)).toBe(false);
    expect(validatePasswordChange({ current: CURRENT, next, confirm: next }).next).toContain(
      "72 byte",
    );
  });

  it("mật khẩu toàn khoảng trắng không hợp lệ", () => {
    expect(isValidNewPassword(" ".repeat(8))).toBe(false);
  });
});

describe("validateProfile", () => {
  it("họ tên bắt buộc, tối đa 120 ký tự", () => {
    expect(validateProfile({ name: "" })).toEqual({ name: "Thông tin đang bị thiếu" });
    expect(validateProfile({ name: "A".repeat(121) }).name).toBeDefined();
    expect(validateProfile({ name: "An" })).toEqual({});
  });
});
