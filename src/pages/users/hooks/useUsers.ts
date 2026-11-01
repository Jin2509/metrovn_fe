import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, adminRbacApi, adminUsersApi, apiErrorMessage, type AdminUser } from "@/lib/api";
import {
  createUserAccount,
  fetchAllUsers,
  logUserAccountAction,
  logUserPasswordReset,
  validateUserAccountDraft,
} from "@/pages/users/users.service";
import { PASSENGER_ROLE, isInScope } from "@/pages/users/users.constants";
import type {
  UserScope,
  UserCreateDraft,
  UserCreateErrors,
  UserRoleFilter,
  UserStatusFilter,
} from "@/pages/users/users.types";

const USERS_KEY = ["admin", "users"];
export const ROLES_KEY = ["admin", "roles"];

const EMPTY_USER_DRAFT: UserCreateDraft = { name: "", email: "", role: "STAFF" };

export function useUsers(scope: UserScope) {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: USERS_KEY, queryFn: fetchAllUsers, retry: false });
  const rolesQuery = useQuery({
    queryKey: ROLES_KEY,
    queryFn: adminRbacApi.listRoles,
    retry: false,
  });
  const allUsers = usersQuery.data ?? [];
  const users = allUsers.filter((user) => isInScope(user, scope));
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRoleFilter>("ALL");
  const [status, setStatus] = useState<UserStatusFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<UserCreateDraft>(EMPTY_USER_DRAFT);
  const [createErrors, setCreateErrors] = useState<UserCreateErrors>({});
  const [pending, setPending] = useState(false);
  const rows = users.filter(
    (user) =>
      (role === "ALL" || user.roles.includes(role)) &&
      (status === "ALL" || user.status === status) &&
      (user.fullName + user.email).toLowerCase().includes(query.toLowerCase()),
  );
  const selectedUser = allUsers.find((user) => user.id === selectedId) ?? null;
  const roleOptions = (rolesQuery.data ?? []).filter((item) => item.code !== PASSENGER_ROLE);

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: USERS_KEY });

  /** Chạy một thao tác thay đổi tài khoản: khoá nút khi đang gửi, báo lỗi, tải lại danh sách. */
  const mutate = async (action: () => Promise<unknown>, success: string) => {
    if (pending) return false;
    setPending(true);
    try {
      await action();
      await refreshUsers();
      toast.success(success);
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      return false;
    } finally {
      setPending(false);
    }
  };

  const confirmLock = async (reason: string) => {
    if (!selectedUser) return;
    const lock = selectedUser.status !== "LOCKED";
    const done = await mutate(
      () => adminUsersApi.setStatus(selectedUser.id, lock ? "LOCKED" : "ACTIVE"),
      lock ? "Đã chặn quyền" : "Đã mở quyền",
    );
    if (!done) return;
    logUserAccountAction(lock, selectedUser.email, reason);
    setLockOpen(false);
  };

  const confirmPasswordReset = async (newPassword: string) => {
    if (!selectedUser) return;
    const done = await mutate(
      () => adminUsersApi.resetPassword(selectedUser.id, newPassword),
      "Đã đặt lại mật khẩu, mật khẩu mới được gửi qua email",
    );
    if (!done) return;
    logUserPasswordReset(selectedUser.email);
    setResetOpen(false);
  };

  const saveRoles = (user: AdminUser, roles: string[]) =>
    mutate(() => adminUsersApi.setRoles(user.id, roles), "Đã cập nhật vai trò");

  const submitCreate = async () => {
    if (pending) return;
    const errors = validateUserAccountDraft(
      createDraft,
      allUsers.map((user) => user.email),
    );
    setCreateErrors(errors);
    if (Object.keys(errors).length) return;
    setPending(true);
    try {
      await createUserAccount(createDraft);
      await refreshUsers();
      toast.success("Đã tạo tài khoản, mật khẩu được gửi qua email");
      setCreateDraft(EMPTY_USER_DRAFT);
      setCreateOpen(false);
    } catch (error) {
      // `errors` của backend có thể là tiếng Anh: chỉ dùng để biết field nào sai.
      const fields = error instanceof ApiError ? error.fieldErrors : {};
      if (error instanceof ApiError && error.status === 409)
        setCreateErrors({ email: "Email đã tồn tại" });
      else if (fields.email || fields.fullName)
        setCreateErrors({
          email: fields.email && "Email không hợp lệ",
          name: fields.fullName && "Họ tên không hợp lệ",
        });
      else toast.error(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return {
    query,
    setQuery,
    role,
    setRole,
    status,
    setStatus,
    rows,
    total: users.length,
    lockedCount: users.filter((user) => user.status === "LOCKED").length,
    loading: usersQuery.isPending,
    loadError: usersQuery.isError ? apiErrorMessage(usersQuery.error) : "",
    reload: () => void refreshUsers(),
    roleOptions,
    selectedUser,
    setSelectedUser: (user: AdminUser | null) => setSelectedId(user?.id ?? null),
    lockOpen,
    setLockOpen,
    resetOpen,
    setResetOpen,
    createOpen,
    setCreateOpen,
    createDraft,
    setCreateDraft,
    createErrors,
    pending,
    confirmLock,
    confirmPasswordReset,
    saveRoles,
    submitCreate,
  };
}
