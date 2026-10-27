import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Cùng cách tô màu với StatusBadge trong shared.tsx (nền nhạt + chữ đậm theo token).
const roleStyles: Record<Role, string> = {
  ADMIN: "bg-primary/15 text-primary",
  MANAGER: "bg-accent/20 text-accent-foreground",
  ACCOUNTANT: "bg-success/15 text-success",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap border-transparent font-medium",
        roleStyles[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </Badge>
  );
}
