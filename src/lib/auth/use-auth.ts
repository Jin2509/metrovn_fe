import { can, type Action } from "./permissions";
import { authStore } from "./session.store";

export function useAuth() {
  const { status, user, endedBy } = authStore.use();
  return {
    status,
    user,
    endedBy,
    role: user?.role ?? null,
    isAuthenticated: status === "authenticated",
    can: (action: Action) => !!user && can(user.role, action),
    /** Kiểm tra theo mã quyền của backend (vd. "USER_MANAGE"). */
    hasPermission: (permission: string) => !!user && user.permissions.includes(permission),
  };
}
