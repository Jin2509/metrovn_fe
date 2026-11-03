import type { ResetDraft, ResetErrors } from "@/pages/forgotpassword/forgotpassword.types";
import { validateNewPassword } from "@/pages/profile/profile.service";

/** Backend chờ 60 giây giữa hai lần gửi mã. */
export const RESEND_COOLDOWN_SECONDS = 60;

export const RESET_CODE_LENGTH = 6;

/** Mã chép từ email hay dính khoảng trắng; ô nhập từ chối cả chuỗi nếu có ký tự không phải số. */
export function normalizePastedCode(pasted: string): string {
  return pasted.replace(/\D/g, "");
}

export function validateResetDraft(draft: ResetDraft): ResetErrors {
  const errors: ResetErrors = {};
  if (!/^\d{6}$/.test(draft.code)) errors.code = "Vui lòng nhập đủ 6 chữ số của mã xác thực";
  const passwordError = validateNewPassword(draft.password);
  if (passwordError) errors.password = passwordError;
  if (draft.confirm !== draft.password) errors.confirm = "Mật khẩu nhập lại không khớp";
  return errors;
}
