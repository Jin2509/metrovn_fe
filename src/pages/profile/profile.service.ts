export type PasswordDraft = { current: string; next: string; confirm: string };
export type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>;

/** Quy tắc mật khẩu mới (trùng với kiểm tra phía backend khi đăng ký/đặt lại mật khẩu). */
export const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "Ít nhất 8 ký tự" },
  { test: (p: string) => /[A-Za-z]/.test(p) && /\d/.test(p), label: "Có cả chữ và số" },
] as const;

export function validatePasswordChange(draft: PasswordDraft): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!draft.current) errors.current = "Nhập mật khẩu hiện tại";
  if (PASSWORD_RULES.some((r) => !r.test(draft.next)))
    errors.next = "Mật khẩu mới cần ít nhất 8 ký tự, có cả chữ và số";
  else if (draft.next === draft.current) errors.next = "Mật khẩu mới phải khác mật khẩu hiện tại";
  if (draft.confirm !== draft.next) errors.confirm = "Mật khẩu nhập lại không khớp";
  return errors;
}

export type ProfileDraft = { name: string; phone: string };

export function validateProfile(d: ProfileDraft): Partial<Record<keyof ProfileDraft, string>> {
  const errors: Partial<Record<keyof ProfileDraft, string>> = {};
  if (d.name.trim().length < 2) errors.name = "Thông tin đang bị thiếu";
  if (d.phone && !/^0\d{9}$/.test(d.phone.replace(/\s/g, "")))
    errors.phone = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0";
  return errors;
}
