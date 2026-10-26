import { useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { findNavGroup, findNavItem } from "@/components/layout/nav.config";

export function Header({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const group = findNavGroup(pathname);
  const subtitle = description ?? findNavItem(pathname)?.description;

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-4 md:px-6 lg:px-8">
        <MobileNav />
        <div className="min-w-0 flex-1">
          {group && (
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Metro Admin <ChevronRight className="h-3 w-3" /> {group.title}
            </p>
          )}
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
