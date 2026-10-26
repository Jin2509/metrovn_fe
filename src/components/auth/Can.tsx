import type { ReactNode } from "react";
import { useAuth, type Action } from "@/lib/auth";

/** Chỉ hiển thị `children` khi vai trò hiện tại được phép thực hiện `action`. */
export function Can({
  action,
  fallback = null,
  children,
}: {
  action: Action;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can } = useAuth();
  return <>{can(action) ? children : fallback}</>;
}
