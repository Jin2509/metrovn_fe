import { describe, expect, it } from "vitest";

import {
  normalizePastedCode,
  validateResetDraft,
} from "@/pages/forgotpassword/forgotpassword.service";

const valid = { code: "012345", password: "MatKhau123", confirm: "MatKhau123" };

describe("normalizePastedCode", () => {
  it("chỉ giữ chữ số, kể cả số 0 ở đầu", () => {
    expect(normalizePastedCode(" 012345\n")).toBe("012345");
    expect(normalizePastedCode("012 345")).toBe("012345");
    expect(normalizePastedCode("Mã: 012345")).toBe("012345");
  });
});

describe("validateResetDraft", () => {
  it("hợp lệ thì không có lỗi, kể cả mã có số 0 ở đầu", () => {
    expect(validateResetDraft(valid)).toEqual({});
  });

  it("mã phải đúng 6 chữ số", () => {
    for (const code of ["", "12345", "1234567", "12a456"])
      expect(validateResetDraft({ ...valid, code }).code, code).toBeTruthy();
  });

  it("mật khẩu mới theo cùng quy tắc với trang hồ sơ", () => {
    expect(validateResetDraft({ ...valid, password: "abc1", confirm: "abc1" }).password).toBe(
      "Mật khẩu mới cần ít nhất 8 ký tự, có cả chữ và số",
    );
    const tooLong = "a1".repeat(40);
    expect(validateResetDraft({ ...valid, password: tooLong, confirm: tooLong }).password).toMatch(
      "quá dài",
    );
  });

  it("mật khẩu nhập lại phải khớp", () => {
    expect(validateResetDraft({ ...valid, confirm: "khac123456" }).confirm).toBe(
      "Mật khẩu nhập lại không khớp",
    );
  });
});
