import { Link } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logout, useAuth } from "@/lib/auth";
import { initials } from "@/lib/utils";

/** Thẻ người dùng ở cuối sidebar: ai đang đăng nhập, vai trò gì, cài đặt tài khoản, đăng xuất. */
export function UserCard({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user } = useAuth();
  if (!user) return null;

  if (collapsed)
    return (
      <div className="flex flex-col items-center gap-1 py-3">
        <Avatar className="mb-1 h-9 w-9" title={`${user.name} · ${user.email}`}>
          <AvatarFallback className="bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <Button
          asChild
          size="icon"
          variant="ghost"
          aria-label="Cài đặt tài khoản"
          title="Cài đặt tài khoản"
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Link to="/profile">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => {
            logout();
            toast.success("Đã đăng xuất");
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );

  return (
    <div className="m-3 space-y-3 rounded-lg bg-sidebar-accent p-3 text-xs">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
            {user.name}
          </p>
          <p className="truncate opacity-70">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <RoleBadge role={user.role} />
        <div className="flex items-center">
          <Button
            asChild
            size="icon"
            variant="ghost"
            aria-label="Cài đặt tài khoản"
            title="Cài đặt tài khoản"
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar hover:text-sidebar-accent-foreground"
          >
            <Link to="/profile" onClick={onNavigate}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 px-2 text-sidebar-foreground hover:bg-sidebar hover:text-sidebar-accent-foreground"
            onClick={() => {
              logout();
              toast.success("Đã đăng xuất");
            }}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  );
}
