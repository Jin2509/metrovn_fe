import { describe, expect, it } from "vitest";

import { validateRoleDraft } from "@/pages/settings/settings.service";

describe("validateRoleDraft", () => {
  it("mã vai trò theo dạng [A-Z][A-Z0-9_]{1,49}, tên bắt buộc", () => {
    const draft = { code: "AUDITOR_1", name: "Kiểm toán", permissions: [] };
    expect(validateRoleDraft(draft)).toEqual({});
    for (const code of ["A", "1AB", "ab", `A${"B".repeat(50)}`])
      expect(validateRoleDraft({ ...draft, code }).code, code).toBeDefined();
    expect(validateRoleDraft({ ...draft, name: " " }).name).toBeDefined();
  });
});
