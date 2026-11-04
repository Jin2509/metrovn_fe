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
