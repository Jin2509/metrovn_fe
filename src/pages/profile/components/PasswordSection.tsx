import { Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordRules } from "@/pages/profile/components/PasswordRules";
import type { PasswordDraft } from "@/pages/profile/profile.service";
import { usePasswordChange } from "@/pages/profile/hooks/useProfile";

const FIELDS: { key: keyof PasswordDraft; label: string; autoComplete: string }[] = [
  { key: "current", label: "Mật khẩu hiện tại", autoComplete: "current-password" },
  { key: "next", label: "Mật khẩu mới", autoComplete: "new-password" },
  { key: "confirm", label: "Nhập lại mật khẩu mới", autoComplete: "new-password" },
];

export function PasswordSection() {
  const { draft, setDraft, errors, pending, submit } = usePasswordChange();
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
        <PasswordRules password={draft.next} />
        <Button type="submit" className="w-full" disabled={pending}>
          Cập nhật mật khẩu
        </Button>
        <p className="text-xs text-muted-foreground">
          Sau khi đổi, mọi thiết bị kể cả thiết bị này sẽ phải đăng nhập lại.
        </p>
      </form>
    </Section>
  );
}
