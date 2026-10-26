import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/pages/login/components/PasswordField";
import type { LoginDraft, LoginErrors } from "@/pages/login/login.types";

export function LoginForm({
  draft,
  errors,
  formError,
  pending,
  onChange,
  onSubmit,
}: {
  draft: LoginDraft;
  errors: LoginErrors;
  formError: string;
  pending: boolean;
  onChange: (changes: Partial<LoginDraft>) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="username"
          autoFocus
          placeholder="ten@metro.vn"
          value={draft.email}
          disabled={pending}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          onChange={(event) => onChange({ email: event.target.value })}
        />
        {errors.email && (
          <p id="login-email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="login-password">Mật khẩu</Label>
        <PasswordField
          id="login-password"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          value={draft.password}
          disabled={pending}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          onChange={(event) => onChange({ password: event.target.value })}
        />
        {errors.password && (
          <p id="login-password-error" className="text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="login-remember"
          checked={draft.remember}
          disabled={pending}
          onCheckedChange={(checked) => onChange({ remember: checked === true })}
        />
        <Label htmlFor="login-remember" className="cursor-pointer font-normal">
          Ghi nhớ đăng nhập trên thiết bị này
        </Label>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
    </form>
  );
}
