import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import { AuthError, requestPasswordReset, resetPassword } from "@/lib/auth";
import {
  RESEND_COOLDOWN_SECONDS,
  validateResetDraft,
} from "@/pages/forgotpassword/forgotpassword.service";
import type { ResetDraft, ResetErrors } from "@/pages/forgotpassword/forgotpassword.types";
import { useRedirectIfAuthenticated } from "@/pages/forgotpassword/hooks/useRedirectIfAuthenticated";

const EMPTY_RESET_DRAFT: ResetDraft = { code: "", password: "", confirm: "" };

export function useResetPassword(email: string) {
  useRedirectIfAuthenticated();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ResetDraft>(EMPTY_RESET_DRAFT);
  const [errors, setErrors] = useState<ResetErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  // Trang này mở ngay sau khi gửi mã. Nếu đếm dư, nút gửi lại chỉ mở muộn hơn một chút.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const updateDraft = (changes: Partial<ResetDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setErrors((current) => {
      const next = { ...current };
      for (const field of Object.keys(changes) as (keyof ResetDraft)[]) delete next[field];
      return next;
    });
    setFormError("");
  };

  const submit = async () => {
    // Đang gửi lại thì mã đang nhập sắp mất hiệu lực.
    if (pending || resending) return;
    const nextErrors = validateResetDraft(draft);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      await resetPassword({ email, code: draft.code, newPassword: draft.password });
      toast.success("Đã đặt lại mật khẩu, vui lòng đăng nhập bằng mật khẩu mới");
      await navigate({ to: "/login", replace: true });
    } catch (error) {
      if (error instanceof AuthError && error.code === "INVALID_NEW_PASSWORD")
        setErrors({ password: error.message });
      else if (error instanceof AuthError && error.code === "INVALID_RESET_CODE")
        setErrors({ code: error.message });
      else
        setFormError(
          error instanceof AuthError
            ? error.message
            : apiErrorMessage(error, "Không thể đặt lại mật khẩu, vui lòng thử lại"),
        );
      // Mã đã bị khoá thì nhập lại cũng không dùng được.
      if (error instanceof AuthError && error.code === "RESET_CODE_LOCKED")
        setDraft((current) => ({ ...current, code: "" }));
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    if (pending || resending || cooldown > 0) return;
    setResending(true);
    setFormError("");
    try {
      const { retryAfter } = await requestPasswordReset(email);
      setCooldown(retryAfter ?? RESEND_COOLDOWN_SECONDS);
      if (retryAfter === undefined) {
        // Mã mới làm mã cũ mất hiệu lực.
        setDraft((current) => ({ ...current, code: "" }));
        setErrors((current) => ({ ...current, code: undefined }));
        toast.success("Đã gửi lại yêu cầu, vui lòng kiểm tra email");
      }
    } catch (error) {
      setFormError(apiErrorMessage(error, "Không thể gửi lại mã, vui lòng thử lại"));
    } finally {
      setResending(false);
    }
  };

  return { draft, updateDraft, errors, formError, pending, resending, cooldown, submit, resend };
}
