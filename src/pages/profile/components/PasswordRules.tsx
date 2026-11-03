import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "@/pages/profile/profile.service";

export function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li
            key={r.label}
            className={cn(
              "flex items-center gap-1.5",
              ok ? "text-success" : "text-muted-foreground",
            )}
          >
            {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
