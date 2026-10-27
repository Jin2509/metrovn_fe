import { useEffect, useState } from "react";
import { toast } from "sonner";
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

  const submit = () => {
    const next = validatePasswordChange(draft);
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      changePassword(draft.current, draft.next);
      toast.success("Đã đổi mật khẩu");
      setDraft(EMPTY);
    } catch (e) {
      if (e instanceof AuthError) setErrors({ current: e.message });
      else throw e;
    }
  };

  return { draft, setDraft, errors, submit };
}

export function useProfileForm() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<ProfileDraft>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileDraft, string>>>({});
  useEffect(
    () => setDraft({ name: user?.name ?? "", phone: user?.phone ?? "" }),
    [user?.name, user?.phone],
  );
  const dirty = draft.name !== (user?.name ?? "") || draft.phone !== (user?.phone ?? "");

  const submit = () => {
    const next = validateProfile(draft);
    setErrors(next);
    if (Object.keys(next).length) return;
    updateProfile({ name: draft.name.trim(), phone: draft.phone.replace(/\s/g, "") });
    toast.success("Đã cập nhật hồ sơ");
  };

  return { draft, setDraft, errors, dirty, submit };
}
