import { describe, expect, it } from "vitest";

import { DEMO_PASSWORD } from "@/mocks/accounts";
import { validatePasswordChange, validateProfile } from "@/pages/profile/profile.service";

describe("validatePasswordChange", () => {
  it("yêu cầu mật khẩu đủ mạnh, khác mật khẩu cũ và nhập lại khớp", () => {
    expect(validatePasswordChange({ current: "", next: "abc", confirm: "abd" })).toEqual({
      current: "Nhập mật khẩu hiện tại",
      next: "Mật khẩu mới cần ít nhất 8 ký tự, có cả chữ và số",
      confirm: "Mật khẩu nhập lại không khớp",
    });
    expect(
      validatePasswordChange({
        current: DEMO_PASSWORD,
        next: DEMO_PASSWORD,
        confirm: DEMO_PASSWORD,
      }).next,
    ).toBe("Mật khẩu mới phải khác mật khẩu hiện tại");
    expect(
      validatePasswordChange({ current: DEMO_PASSWORD, next: "metro2027", confirm: "metro2027" }),
    ).toEqual({});
  });
});

describe("validateProfile", () => {
  it("họ tên bắt buộc, số điện thoại không bắt buộc nhưng phải đúng định dạng", () => {
    expect(validateProfile({ name: "", phone: "" })).toEqual({ name: "Thông tin đang bị thiếu" });
    expect(validateProfile({ name: "An", phone: "12345" }).phone).toBeDefined();
    expect(validateProfile({ name: "An", phone: "0901 234 567" })).toEqual({});
  });
});
