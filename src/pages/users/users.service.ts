import { adminUsersApi, type AdminUser } from "@/lib/api";
import { logAction } from "@/mocks/admin";
import type { UserCreateDraft, UserCreateErrors } from "@/pages/users/users.types";

const PAGE_SIZE = 100;

/**
 * Tải toàn bộ tài khoản: backend chưa có bộ lọc theo vai trò, nên phải lọc ở client thì
 * hai tab "Nhân sự nội bộ" và "Hành khách" mới đếm và phân trang đúng.
 */
export async function fetchAllUsers(): Promise<AdminUser[]> {
  const users: AdminUser[] = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages) {
    const result = await adminUsersApi.list({ page, size: PAGE_SIZE, sort: "createdAt,desc" });
    users.push(...result.content);
    totalPages = result.page.totalPages;
    page += 1;
  }
  return users;
}

export function logUserAccountAction(locked: boolean, email: string, reason: string) {
  logAction(locked ? "Khóa tài khoản" : "Mở tài khoản", `${email} (${reason})`);
}

export function logUserPasswordReset(email: string) {
  logAction("Đặt lại mật khẩu", email);
}

export function validateUserAccountDraft(
  draft: UserCreateDraft,
  emails: string[],
): UserCreateErrors {
  const errors: UserCreateErrors = {};
  const name = draft.name.trim();
  const email = draft.email.trim().toLowerCase();
  if (name.length < 2 || name.length > 120) errors.name = "Họ tên không hợp lệ";
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) errors.email = "Email không hợp lệ";
  else if (emails.includes(email)) errors.email = "Email đã tồn tại";
  return errors;
}

export function createUserAccount(draft: UserCreateDraft) {
  return adminUsersApi.create({
    email: draft.email.trim().toLowerCase(),
    fullName: draft.name.trim(),
    roles: [draft.role],
  });
}
