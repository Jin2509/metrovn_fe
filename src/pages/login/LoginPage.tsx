import { AuthPageLayout } from "@/pages/login/components/AuthPageLayout";
import { LoginForm } from "@/pages/login/components/LoginForm";
import { useLogin } from "@/pages/login/hooks/useLogin";

export function LoginPage({ redirect }: { redirect?: string }) {
  const login = useLogin(redirect);

  return (
    <AuthPageLayout
      title="Đăng nhập"
      description="Dùng tài khoản quản trị do Admin cấp để tiếp tục."
    >
      <LoginForm
        draft={login.draft}
        errors={login.errors}
        formError={login.formError}
        pending={login.pending}
        onChange={login.updateDraft}
        onSubmit={login.submit}
      />
    </AuthPageLayout>
  );
}
