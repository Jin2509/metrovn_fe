import { describe, expect, it } from "vitest";

import { navGroups } from "@/components/layout/nav.config";
import { ROLES, canAccessRoute, can, type Action } from "@/lib/auth";
import {
  buildActionMatrix,
  buildScreenMatrix,
  validateRoleDraft,
} from "@/pages/settings/settings.service";

describe("bảng phân quyền", () => {
  it("có đủ mọi màn hình trên menu và khớp với canAccessRoute", () => {
    const rows = buildScreenMatrix();
    const menu = navGroups.flatMap((g) => g.items.map((i) => i.to));
    expect(rows.map((r) => r.key)).toEqual([...menu, "/profile"]);
    for (const row of rows)
      for (const role of ROLES)
        expect(row.roles[role], `${row.key} ${role}`).toBe(canAccessRoute(role, row.key));
  });

  it("bảng thao tác khớp với can()", () => {
    for (const row of buildActionMatrix())
      for (const role of ROLES) expect(row.roles[role]).toBe(can(role, row.key as Action));
  });
});

describe("validateRoleDraft", () => {
  it("mã vai trò theo dạng [A-Z][A-Z0-9_]{1,49}, tên bắt buộc", () => {
    const draft = { code: "AUDITOR_1", name: "Kiểm toán", permissions: [] };
    expect(validateRoleDraft(draft)).toEqual({});
    for (const code of ["A", "1AB", "ab", `A${"B".repeat(50)}`])
      expect(validateRoleDraft({ ...draft, code }).code, code).toBeDefined();
    expect(validateRoleDraft({ ...draft, name: " " }).name).toBeDefined();
  });
});
