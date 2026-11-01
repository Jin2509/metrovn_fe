export type PasswordDraft = { current: string; next: string; confirm: string };
export type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>;

/** Giới hạn của backend: từ 8 ký tự, tối đa 72 byte UTF-8, không được toàn khoảng trắng. */
export const isValidNewPassword = (p: string) =>
  p.length >= 8 && new TextEncoder().encode(p).length <= 72 && p.trim().length > 0;

/** Quy tắc mật khẩu mới: giới hạn của backend, cộng thêm yêu cầu có cả chữ và số ở web. */
export const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "Ít nhất 8 ký tự" },
  { test: (p: string) => /[A-Za-z]/.test(p) && /\d/.test(p), label: "Có cả chữ và số" },
] as const;

export function validatePasswordChange(draft: PasswordDraft): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!draft.current) errors.current = "Nhập mật khẩu hiện tại";
  if (PASSWORD_RULES.some((r) => !r.test(draft.next)))
    errors.next = "Mật khẩu mới cần ít nhất 8 ký tự, có cả chữ và số";
  else if (!isValidNewPassword(draft.next))
    errors.next = "Mật khẩu mới quá dài (tối đa 72 byte, ký tự có dấu tính nhiều byte hơn)";
  else if (draft.next === draft.current) errors.next = "Mật khẩu mới phải khác mật khẩu hiện tại";
  if (draft.confirm !== draft.next) errors.confirm = "Mật khẩu nhập lại không khớp";
  return errors;
}

export type ProfileDraft = { name: string };

export function validateProfile(d: ProfileDraft): Partial<Record<keyof ProfileDraft, string>> {
  const errors: Partial<Record<keyof ProfileDraft, string>> = {};
  const name = d.name.trim();
  if (name.length < 2) errors.name = "Thông tin đang bị thiếu";
  else if (name.length > 120) errors.name = "Họ tên tối đa 120 ký tự";
  return errors;
}
