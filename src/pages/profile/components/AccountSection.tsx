import { Link } from "@tanstack/react-router";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { getVisibleNavGroups } from "@/components/layout/nav.config";
import { Section } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_DESCRIPTIONS, type SessionUser } from "@/lib/auth";
import { initials } from "@/lib/utils";

export function AccountSection({ user }: { user: SessionUser }) {
  const groups = getVisibleNavGroups(user.role);
  return (
    <Section title="Tài khoản" description="Email và vai trò do Admin quản lý">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">Mã nhân sự {user.id}</p>
        </div>
      </div>
      <div className="mt-5 space-y-2 rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <RoleBadge role={user.role} />
          <span className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[user.role]}</span>
        </div>
        <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Màn hình được sử dụng
        </p>
        <div className="flex flex-wrap gap-1.5">
          {groups
            .flatMap((g) => g.items)
            .map((i) => (
              <Link
                key={i.to}
                to={i.to}
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs hover:border-primary/40 hover:text-primary"
              >
                <i.icon className="h-3.5 w-3.5" />
                {i.label}
              </Link>
            ))}
        </div>
      </div>
    </Section>
  );
}
