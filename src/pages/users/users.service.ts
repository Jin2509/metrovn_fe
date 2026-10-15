import { logAction, submitApproval, usersStore, type User } from "@/mocks/admin";
import type { UserCreateDraft, UserCreateErrors } from "@/pages/users/users.types";

export function updateUserAccess(user: User, changes: Partial<User>) {
  usersStore.set((users) =>
    users.map((currentUser) =>
      currentUser.id === user.id ? { ...currentUser, ...changes } : currentUser,
    ),
  );
}

export function logUserAccountAction(locked: boolean, email: string) {
  logAction(locked ? "Khóa tài khoản" : "Mở tài khoản", email);
}

export function logUserPasswordReset(email: string) {
  logAction("Đặt lại mật khẩu", email);
}

export function validateUserAccountDraft(
  draft: UserCreateDraft,
  emails: string[],
): UserCreateErrors {
  const errors: UserCreateErrors = {};
  if (draft.name.trim().length < 2) errors.name = "Họ tên không hợp lệ";
  if (!/^\S+@\S+\.\S+$/.test(draft.email)) errors.email = "Email không hợp lệ";
  else if (emails.includes(draft.email)) errors.email = "Email đã tồn tại";
  return errors;
}

export function submitUserAccountApproval(draft: UserCreateDraft) {
  submitApproval(
    "ACCOUNT",
    `Tạo tài khoản ${draft.role === "STAFF" ? "nhân viên" : "kế toán"}: ${draft.name}`,
    [
      { field: "Vai trò", old: "—", new: draft.role },
      { field: "Email", old: "—", new: draft.email },
      { field: "Mật khẩu", old: "—", new: "Mặc định (bắt buộc đổi)" },
    ],
  );
}
