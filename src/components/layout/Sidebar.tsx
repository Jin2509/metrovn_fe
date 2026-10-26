import { Link } from "@tanstack/react-router";
import { TrainFront } from "lucide-react";
import { UserCard } from "@/components/layout/UserCard";
import { getVisibleNavGroups } from "@/components/layout/nav.config";
import { useAuth } from "@/lib/auth";
import { approvalsStore } from "@/mocks/admin";

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20">
        <TrainFront className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-semibold tracking-tight text-sidebar-accent-foreground">Metro Admin</p>
        <p className="text-xs opacity-60">TP. Hồ Chí Minh</p>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth();
  const pending = approvalsStore.use().filter((a) => a.status === "PENDING").length;
  const groups = role ? getVisibleNavGroups(role) : [];

  return (
    <nav aria-label="Điều hướng chính" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
      {groups.map((g) => (
        <div key={g.title} className="space-y-0.5">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-45">
            {g.title}
          </p>
          {g.items.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-sidebar-primary",
              }}
              activeOptions={{ exact: true, includeSearch: false }}
            >
              <n.icon className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
              <span className="flex-1 truncate">{n.label}</span>
              {n.to === "/approvals" && pending > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                  {pending}
                </span>
              )}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

/** Nội dung sidebar dùng chung cho cột cố định (desktop) và ngăn kéo (mobile). */
export function SidebarPanel({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <SidebarBrand />
      <SidebarNav onNavigate={onNavigate} />
      <UserCard />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
      <SidebarPanel />
    </aside>
  );
}
