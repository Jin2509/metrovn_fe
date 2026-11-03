import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

/** Đặt lại mật khẩu sẽ thu hồi mọi phiên, nên chỉ dành cho người chưa đăng nhập. */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.history.replace("/");
  }, [status, router]);
}
