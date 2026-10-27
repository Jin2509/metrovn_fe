import { describe, expect, it } from "vitest";

import { navGroups } from "@/components/layout/nav.config";
import { ROLES, canAccessRoute, can, type Action } from "@/lib/auth";
import { buildActionMatrix, buildScreenMatrix } from "@/pages/settings/settings.service";

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
