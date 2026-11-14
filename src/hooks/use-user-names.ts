import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchAllUsers } from "@/pages/users/users.service";

const USERS_KEY = ["admin", "users"];

/**
 * Tên hiển thị theo mã tài khoản (UUID) mà backend trả về ở các trường như `reportedBy`.
 * Chỉ tải danh sách tài khoản khi có quyền USER_VIEW; không có thì hiện mã rút gọn.
 */
export function useUserNames() {
  const canView = useAuth().hasPermission("USER_VIEW");
  const query = useQuery({
    queryKey: USERS_KEY,
    queryFn: fetchAllUsers,
    enabled: canView,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const byId = new Map((query.data ?? []).map((u) => [u.id, u.fullName]));
  return (id: string | null | undefined) =>
    !id ? "—" : (byId.get(id) ?? `Tài khoản ${id.slice(0, 8)}`);
}
