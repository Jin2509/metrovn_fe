import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import { AuthError, changePassword, updateProfile, useAuth } from "@/lib/auth";
import {
  validatePasswordChange,
  validateProfile,
  type PasswordDraft,
  type PasswordErrors,
  type ProfileDraft,
} from "@/pages/profile/profile.service";

const EMPTY: PasswordDraft = { current: "", next: "", confirm: "" };

export function usePasswordChange() {
  const [draft, setDraft] = useState<PasswordDraft>(EMPTY);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (pending) return;
    const next = validatePasswordChange(draft);
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    try {
      await changePassword(draft.current, draft.next);
      toast.success("Đã đổi mật khẩu, vui lòng đăng nhập lại");
      setDraft(EMPTY);
    } catch (e) {
      if (e instanceof AuthError && e.code === "INVALID_NEW_PASSWORD")
        setErrors({ next: e.message });
      else if (e instanceof AuthError) setErrors({ current: e.message });
      else toast.error(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return { draft, setDraft, errors, pending, submit };
}

export function useProfileForm() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<ProfileDraft>({ name: user?.name ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileDraft, string>>>({});
  const [pending, setPending] = useState(false);
  useEffect(() => setDraft({ name: user?.name ?? "" }), [user?.name]);
  const dirty = draft.name !== (user?.name ?? "");

  const submit = async () => {
    if (pending) return;
    const next = validateProfile(draft);
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    try {
      await updateProfile({ name: draft.name.trim() });
      toast.success("Đã cập nhật hồ sơ");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return { draft, setDraft, errors, dirty, pending, submit };
}
