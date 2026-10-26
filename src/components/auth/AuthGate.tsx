import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { AuthSplash } from "@/components/auth/AuthSplash";
import { findNavItem } from "@/components/layout/nav.config";
import { canAccessRoute, hydrateSession, isPublicPath, useAuth, watchSession } from "@/lib/auth";

/**
 * Cổng bảo vệ cho toàn bộ app, đặt một lần ở route gốc:
 *  1. Đọc phiên đăng nhập sau khi mount (server luôn render trạng thái "loading").
 *  2. Chưa đăng nhập → chuyển tới /login (kèm trang đang xem để quay lại sau khi đăng nhập).
 *  3. Đã đăng nhập nhưng vai trò không đủ quyền → hiện AccessDenied, trang đích KHÔNG được mount.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, user, endedBy } = useAuth();
  const navigate = useNavigate();
  const { pathname, href } = useRouterState({
    select: (s) => ({ pathname: s.location.pathname, href: s.location.href }),
  });
  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    hydrateSession();
    return watchSession(() => toast.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"));
  }, []);

  useEffect(() => {
    if (status === "anonymous" && !isPublic)
      navigate({
        to: "/login",
        search: endedBy === "logout" ? {} : { redirect: href },
        replace: true,
      });
  }, [status, isPublic, endedBy, href, navigate]);

  if (isPublic) return <>{children}</>;
  if (status !== "authenticated" || !user) return <AuthSplash />;

  if (!canAccessRoute(user.role, pathname))
    return (
      <AppShell title={findNavItem(pathname)?.label ?? "Không có quyền truy cập"}>
        <AccessDenied role={user.role} pathname={pathname} />
      </AppShell>
    );

  return <>{children}</>;
}
