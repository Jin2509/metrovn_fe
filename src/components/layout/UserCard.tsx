import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logout, useAuth } from "@/lib/auth";

const initials = (name: string) => {
  const words = name.trim().split(/\s+/);
  return (
    (words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")
  ).toUpperCase();
};

/** Thẻ người dùng ở cuối sidebar: ai đang đăng nhập, vai trò gì, nút đăng xuất. */
export function UserCard() {
  const { user } = useAuth();
  if (!user) return null;

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
  );
}
