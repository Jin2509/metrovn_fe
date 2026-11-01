import { navGroups } from "@/components/layout/nav.config";
import {
  ACTION_ACCESS,
  ACTION_LABELS,
  ROLES,
  ROUTE_ACCESS,
  type Action,
  type Role,
} from "@/lib/auth";

// ---------- Vai trò trên backend ----------

export type RoleDraft = { code: string; name: string; permissions: string[] };
export type RoleDraftErrors = Partial<Record<"code" | "name", string>>;

export const EMPTY_ROLE_DRAFT: RoleDraft = { code: "", name: "", permissions: [] };

export function validateRoleDraft(draft: RoleDraft): RoleDraftErrors {
  const errors: RoleDraftErrors = {};
  if (!/^[A-Z][A-Z0-9_]{1,49}$/.test(draft.code))
    errors.code = "Mã viết hoa, bắt đầu bằng chữ cái, gồm 2-50 ký tự A-Z, 0-9, _";
  if (!draft.name.trim() || draft.name.length > 100) errors.name = "Tên từ 1 đến 100 ký tự";
  return errors;
}

// ---------- Bảng phân quyền (chỉ đọc, sinh từ permissions.ts) ----------

export type MatrixRow = { key: string; group: string; label: string; roles: Record<Role, boolean> };

const toRoleFlags = (allowed: readonly Role[]) =>
  Object.fromEntries(ROLES.map((r) => [r, allowed.includes(r)])) as Record<Role, boolean>;

/** Màn hình theo nhóm menu + trang cài đặt tài khoản (không nằm trên menu). */
export function buildScreenMatrix(): MatrixRow[] {
  const rows: MatrixRow[] = navGroups.flatMap((g) =>
    g.items.map((i) => ({
      key: i.to,
      group: g.title,
      label: i.label,
      roles: toRoleFlags(ROUTE_ACCESS[i.to]),
    })),
  );
  rows.push({
    key: "/profile",
    group: "Cá nhân",
    label: "Cài đặt tài khoản",
    roles: toRoleFlags(ROUTE_ACCESS["/profile"]),
  });
  return rows;
}

export function buildActionMatrix(): MatrixRow[] {
  return (Object.keys(ACTION_ACCESS) as Action[]).map((a) => ({
    key: a,
    group: "Thao tác",
    label: ACTION_LABELS[a],
    roles: toRoleFlags(ACTION_ACCESS[a]),
  }));
}
