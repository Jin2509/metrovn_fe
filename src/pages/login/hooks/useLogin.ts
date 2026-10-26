import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthError, login, useAuth } from "@/lib/auth";
import { EMPTY_LOGIN_DRAFT } from "@/pages/login/login.constants";
import { resolveRedirectTarget, validateLoginDraft } from "@/pages/login/login.service";
import type { LoginDraft, LoginErrors } from "@/pages/login/login.types";

export function useLogin(redirect?: string) {
  const router = useRouter();
  const { status, role } = useAuth();
  const [draft, setDraft] = useState<LoginDraft>(EMPTY_LOGIN_DRAFT);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  // Đăng nhập xong (hoặc đã đăng nhập sẵn / đăng nhập từ tab khác) → rời trang login.
  useEffect(() => {
    if (status === "authenticated" && role)
      router.history.replace(resolveRedirectTarget(redirect, role));
  }, [status, role, redirect, router]);

  const updateDraft = (changes: Partial<LoginDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setFormError("");
  };

  const submit = async () => {
    if (pending) return;
    const nextErrors = validateLoginDraft(draft);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    try {
      const user = await login(draft);
      toast.success(`Xin chào, ${user.name}`);
    } catch (error) {
      setFormError(
        error instanceof AuthError ? error.message : "Không thể đăng nhập, vui lòng thử lại",
      );
      setDraft((current) => ({ ...current, password: "" }));
    } finally {
      setPending(false);
    }
  };

  return { draft, updateDraft, errors, formError, pending, submit };
}
