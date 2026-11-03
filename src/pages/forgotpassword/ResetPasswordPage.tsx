import { Link } from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { BackToLoginLink } from "@/pages/forgotpassword/components/BackToLoginLink";
import {
  normalizePastedCode,
  RESET_CODE_LENGTH,
} from "@/pages/forgotpassword/forgotpassword.service";
import { useResetPassword } from "@/pages/forgotpassword/hooks/useResetPassword";
import { AuthPageLayout } from "@/pages/login/components/AuthPageLayout";
import { PasswordField } from "@/pages/login/components/PasswordField";
import { PasswordRules } from "@/pages/profile/components/PasswordRules";

export function ResetPasswordPage({ email }: { email: string }) {
  const reset = useResetPassword(email);
  const { draft, errors, pending, cooldown } = reset;

  return (
    <AuthPageLayout
      title="Đặt lại mật khẩu"
      description={
        <>
          Nếu <span className="font-medium text-foreground">{email}</span> là tài khoản đang hoạt
          động, mã gồm 6 chữ số đã được gửi tới email này. Mã có hiệu lực trong 10 phút.
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void reset.submit();
        }}
      >
        {/* Để trình quản lý mật khẩu lưu mật khẩu mới đúng tài khoản. */}
        <input type="email" autoComplete="username" value={email} readOnly hidden />

        {reset.formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{reset.formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="reset-code">Mã xác thực</Label>
          <InputOTP
            id="reset-code"
            autoFocus
            autoComplete="one-time-code"
            maxLength={RESET_CODE_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            pasteTransformer={normalizePastedCode}
            value={draft.code}
            disabled={pending}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? "reset-code-error" : undefined}
            onChange={(code) => reset.updateDraft({ code })}
          >
            <InputOTPGroup>
              {Array.from({ length: RESET_CODE_LENGTH }, (_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {errors.code && (
            <p id="reset-code-error" className="text-xs text-destructive">
              {errors.code}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Không nhận được mã?{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              disabled={cooldown > 0 || reset.resending || pending}
              onClick={() => void reset.resend()}
            >
              {cooldown > 0 ? `Gửi lại sau ${cooldown} giây` : "Gửi lại mã"}
            </button>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reset-password-new">Mật khẩu mới</Label>
          <PasswordField
            id="reset-password-new"
            autoComplete="new-password"
            placeholder="Nhập mật khẩu mới"
            value={draft.password}
            disabled={pending}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "reset-password-new-error" : undefined}
            onChange={(event) => reset.updateDraft({ password: event.target.value })}
          />
          {errors.password && (
            <p id="reset-password-new-error" className="text-xs text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reset-password-confirm">Nhập lại mật khẩu mới</Label>
          <PasswordField
            id="reset-password-confirm"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            value={draft.confirm}
            disabled={pending}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "reset-password-confirm-error" : undefined}
            onChange={(event) => reset.updateDraft({ confirm: event.target.value })}
          />
          {errors.confirm && (
            <p id="reset-password-confirm-error" className="text-xs text-destructive">
              {errors.confirm}
            </p>
          )}
        </div>

        <PasswordRules password={draft.password} />

        <Button type="submit" className="w-full" size="lg" disabled={pending || reset.resending}>
          {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {pending ? "Đang đặt lại…" : "Đặt lại mật khẩu"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Sau khi đặt lại, mọi thiết bị đang đăng nhập sẽ phải đăng nhập lại.
        </p>
      </form>

      <div className="space-y-2">
        <Link
          to="/forgot-password"
          className="block text-center text-sm text-muted-foreground hover:underline"
        >
          Dùng email khác
        </Link>
        <BackToLoginLink />
      </div>
    </AuthPageLayout>
  );
}
