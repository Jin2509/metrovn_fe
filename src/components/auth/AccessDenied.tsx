import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, findRouteRule, type Role } from "@/lib/auth";

export function AccessDenied({ role, pathname }: { role: Role; pathname: string }) {
  const allowed = findRouteRule(pathname) ?? [];
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <ShieldAlert className="h-12 w-12 text-destructive" />
      <p className="mt-3 text-lg font-semibold">Bạn không có quyền truy cập</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Vai trò {ROLE_LABELS[role]} không được phép mở màn hình này
        {allowed.length > 0 && <> — chỉ dành cho {allowed.map((r) => ROLE_LABELS[r]).join(", ")}</>}
        .
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Về trang tổng quan</Link>
      </Button>
    </div>
  );
}
