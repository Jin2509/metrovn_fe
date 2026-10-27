import { Check, X } from "lucide-react";
import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES, type PasswordDraft } from "@/pages/profile/profile.service";
import { usePasswordChange } from "@/pages/profile/hooks/useProfile";

const FIELDS: { key: keyof PasswordDraft; label: string; autoComplete: string }[] = [
  { key: "current", label: "Mật khẩu hiện tại", autoComplete: "current-password" },
  { key: "next", label: "Mật khẩu mới", autoComplete: "new-password" },
  { key: "confirm", label: "Nhập lại mật khẩu mới", autoComplete: "new-password" },
];

export function PasswordSection() {
  const { draft, setDraft, errors, submit } = usePasswordChange();
  return (
    <Section title="Đổi mật khẩu" description="Nên đổi định kỳ 90 ngày một lần">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`pw-${f.key}`}>{f.label}</Label>
            <Input
              id={`pw-${f.key}`}
              type="password"
              autoComplete={f.autoComplete}
              value={draft[f.key]}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            />
            {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
          </div>
        ))}
        <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(draft.next);
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
        <Button type="submit" className="w-full">
          Cập nhật mật khẩu
        </Button>
        <p className="text-xs text-muted-foreground">
          Bản demo chỉ đổi mật khẩu trong phiên hiện tại; tải lại trang sẽ về mật khẩu mặc định.
        </p>
      </form>
    </Section>
  );
}
