import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FutuMascot } from "@/components/brand/FutuMascot";
import { UserCard } from "@/components/layout/UserCard";
import { getVisibleNavGroups } from "@/components/layout/nav.config";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { sidebarCollapsedStore, toggleSidebar } from "@/lib/sidebar";
import { cn } from "@/lib/utils";
import { approvalsStore } from "@/mocks/admin";
import { incidentsStore } from "@/mocks/incidents";
import { isOpen } from "@/pages/incidents/incidents.service";
import {
  studentStats,
  studentVerificationsStore,
} from "@/pages/studentverification/student.service";

/** Số việc đang chờ xử lý hiển thị cạnh mục menu tương ứng. */
function useNavBadges(): Partial<Record<string, number>> {
  const pending = approvalsStore.use().filter((a) => a.status === "PENDING").length;
  const incidents = incidentsStore.use().filter(isOpen).length;
  const students = studentStats(studentVerificationsStore.use()).needsReview;
  return { "/approvals": pending, "/incidents": incidents, "/student-verifications": students };
}

/** Tay nắm tròn nằm giữa cạnh phải sidebar, luôn ở cùng một chỗ dù đang thu gọn hay mở rộng. */
function CollapseHandle({ collapsed }: { collapsed: boolean }) {
  const Icon = collapsed ? ChevronRight : ChevronLeft;
  const label = collapsed ? "Mở rộng menu" : "Thu gọn menu";
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={!collapsed}
      title={label}
      onClick={toggleSidebar}
      className="absolute top-1/2 -right-3.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-foreground shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 py-5", collapsed ? "justify-center px-2" : "px-5")}>
      <FutuMascot className="h-10 w-10" />
      {!collapsed && (
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-semibold tracking-tight text-sidebar-accent-foreground">
            HopOn
          </p>
          <p className="truncate text-xs opacity-60">Cổng quản trị</p>
        </div>
      )}
    </div>
  );
}

const LINK_CLASS =
  "group relative flex items-center rounded-lg text-sm transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground";
const ACTIVE_CLASS =
  "bg-sidebar-accent text-sidebar-accent-foreground font-medium before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-sidebar-primary";

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { role } = useAuth();
  const badges = useNavBadges();
  const groups = role ? getVisibleNavGroups(role) : [];

  return (
    <nav
      aria-label="Điều hướng chính"
      className={cn(
        "flex-1 overflow-x-hidden overflow-y-auto pb-4",
        collapsed ? "space-y-2 px-2" : "space-y-5 px-3",
      )}
    >
      {groups.map((g, index) => (
        <div key={g.title} className="space-y-0.5">
          {collapsed ? (
            index > 0 && <div className="mx-2 mb-2 border-t border-sidebar-border" />
          ) : (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-45">
              {g.title}
            </p>
          )}
          {g.items.map((n) => {
            const badge = badges[n.to];
            if (!collapsed)
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={onNavigate}
                  className={cn(LINK_CLASS, "gap-3 px-3 py-2")}
                  activeProps={{ className: ACTIVE_CLASS }}
                  activeOptions={{ exact: true, includeSearch: false }}
                >
                  <n.icon className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
                  <span className="flex-1 truncate">{n.label}</span>
                  {!!badge && (
                    <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            return (
              <Tooltip key={n.to}>
                <TooltipTrigger asChild>
                  <Link
                    to={n.to}
                    aria-label={badge ? `${n.label}, ${badge} việc chờ xử lý` : n.label}
                    className={cn(LINK_CLASS, "h-9 justify-center")}
                    activeProps={{ className: ACTIVE_CLASS }}
                    activeOptions={{ exact: true, includeSearch: false }}
                  >
                    <n.icon className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
                    {!!badge && (
                      <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-sidebar" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {n.label}
                  {badge ? ` · ${badge}` : ""}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Nội dung sidebar dùng chung cho cột cố định (desktop) và ngăn kéo (mobile). */
export function SidebarPanel({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col">
        <SidebarBrand collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
        <UserCard collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const collapsed = sidebarCollapsedStore.use();
  return (
    <aside
      className={cn(
        "sticky top-0 z-40 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:block",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarPanel collapsed={collapsed} />
      <CollapseHandle collapsed={collapsed} />
    </aside>
  );
}
