import { AlertCircle, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackToLoginLink } from "@/pages/forgotpassword/components/BackToLoginLink";
import { useForgotPassword } from "@/pages/forgotpassword/hooks/useForgotPassword";
import { AuthPageLayout } from "@/pages/login/components/AuthPageLayout";

export function ForgotPasswordPage() {
  const { email, updateEmail, emailError, formError, pending, submit } = useForgotPassword();

  return (
    <AuthPageLayout
      title="Quên mật khẩu"
      description="Nhập email của tài khoản, hệ thống sẽ gửi mã xác thực để đặt lại mật khẩu."
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="username"
            autoFocus
            placeholder="ten@metro.vn"
            value={email}
            disabled={pending}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "forgot-email-error" : undefined}
            onChange={(event) => updateEmail(event.target.value)}
          />
          {emailError && (
            <p id="forgot-email-error" className="text-xs text-destructive">
              {emailError}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Mail />}
          {pending ? "Đang gửi…" : "Gửi mã xác thực"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Website không có đăng ký tài khoản. Nếu chưa có tài khoản, vui lòng liên hệ quản trị viên để
        được cấp.
      </p>
      <BackToLoginLink />
    </AuthPageLayout>
  );
}
