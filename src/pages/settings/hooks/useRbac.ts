import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, adminRbacApi, apiErrorMessage } from "@/lib/api";
import { ROLES_KEY } from "@/pages/users/hooks/useUsers";
import {
  EMPTY_ROLE_DRAFT,
  validateRoleDraft,
  type RoleDraft,
  type RoleDraftErrors,
} from "@/pages/settings/settings.service";

export function useRbac() {
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({
    queryKey: ROLES_KEY,
    queryFn: adminRbacApi.listRoles,
    retry: false,
  });
  const permissionsQuery = useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: adminRbacApi.listPermissions,
    retry: false,
  });
  /** null: đóng; `isNew`: tạo vai trò mới, ngược lại là sửa quyền của vai trò có sẵn. */
  const [editor, setEditor] = useState<{ isNew: boolean; draft: RoleDraft } | null>(null);
  const [errors, setErrors] = useState<RoleDraftErrors>({});
  const [pending, setPending] = useState(false);

  const open = (isNew: boolean, draft: RoleDraft = EMPTY_ROLE_DRAFT) => {
    setErrors({});
    setEditor({ isNew, draft });
  };

  const submit = async () => {
    if (!editor || pending) return;
    const { isNew, draft } = editor;
    const nextErrors = isNew ? validateRoleDraft(draft) : {};
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setPending(true);
    try {
      if (isNew) await adminRbacApi.createRole(draft);
      else await adminRbacApi.setRolePermissions(draft.code, draft.permissions);
      await queryClient.invalidateQueries({ queryKey: ROLES_KEY });
      toast.success(isNew ? "Đã tạo vai trò" : "Đã cập nhật quyền, có hiệu lực ngay");
      setEditor(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409)
        setErrors({ code: "Mã vai trò đã tồn tại" });
      else toast.error(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  const loadError = rolesQuery.error ?? permissionsQuery.error;
  return {
    roles: rolesQuery.data ?? [],
    permissions: permissionsQuery.data ?? [],
    loading: rolesQuery.isPending,
    loadError: loadError ? apiErrorMessage(loadError) : "",
    editor,
    setDraft: (draft: RoleDraft) => setEditor((current) => current && { ...current, draft }),
    close: () => setEditor(null),
    open,
    errors,
    pending,
    submit,
  };
}
