import { useState } from "react";
import { toast } from "sonner";
import { usersStore, type User } from "@/mocks/admin";
import { stations } from "@/mocks/metro";
import {
  logUserAccountAction,
  logUserPasswordReset,
  submitUserAccountApproval,
  updateUserAccess,
  validateUserAccountDraft,
} from "@/pages/users/users.service";
import { isInScope } from "@/pages/users/users.constants";
import type {
  UserScope,
  UserCreateDraft,
  UserCreateErrors,
  UserRoleFilter,
  UserStatusFilter,
} from "@/pages/users/users.types";

const EMPTY_USER_DRAFT: UserCreateDraft = { name: "", email: "", role: "STAFF" };

export function useUsers(scope: UserScope) {
  const allUsers = usersStore.use();
  const users = allUsers.filter((user) => isInScope(user, scope));
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRoleFilter>("ALL");
  const [status, setStatus] = useState<UserStatusFilter>("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<UserCreateDraft>(EMPTY_USER_DRAFT);
  const [createErrors, setCreateErrors] = useState<UserCreateErrors>({});
  const rows = users.filter(
    (user) =>
      (role === "ALL" || user.role === role) &&
      (status === "ALL" || user.status === status) &&
      (user.name + user.email).toLowerCase().includes(query.toLowerCase()),
  );
  const selectedStationName =
    stations.find((station) => station.id === selectedUser?.stationId)?.name ?? "—";

  const confirmLock = (reason: string) => {
    if (!selectedUser) return;
    const lock = selectedUser.status !== "LOCKED";
    const changes = {
      status: lock ? ("LOCKED" as const) : ("ACTIVE" as const),
      lockReason: lock ? reason : undefined,
    };
    updateUserAccess(selectedUser, changes);
    setSelectedUser((user) => (user ? { ...user, ...changes } : user));
    logUserAccountAction(lock, selectedUser.email);
    toast.success(lock ? "Đã chặn quyền" : "Đã mở quyền");
    setLockOpen(false);
  };

  const confirmPasswordReset = () => {
    logUserPasswordReset(selectedUser?.email ?? "");
    toast.success("Đã đặt lại mật khẩu");
  };

  const submitCreate = () => {
    const errors = validateUserAccountDraft(
      createDraft,
      allUsers.map((user) => user.email),
    );
    setCreateErrors(errors);
    if (Object.keys(errors).length) return;
    submitUserAccountApproval(createDraft);
    toast.success("Đã gửi yêu cầu tạo tài khoản, chờ Manager duyệt");
    setCreateDraft(EMPTY_USER_DRAFT);
    setCreateOpen(false);
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
    selectedUser,
    setSelectedUser,
    selectedStationName,
    lockOpen,
    setLockOpen,
    resetOpen,
    setResetOpen,
    createOpen,
    setCreateOpen,
    createDraft,
    setCreateDraft,
    createErrors,
    confirmLock,
    confirmPasswordReset,
    submitCreate,
  };
}
