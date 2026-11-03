import { createFileRoute, redirect } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { ResetPasswordPage } from "@/pages/forgotpassword";
import { validateEmail } from "@/pages/login/login.service";

export const Route = createFileRoute("/reset-password")({
  head: seo("Đặt lại mật khẩu", "Đặt lại mật khẩu tài khoản Metro TP.HCM bằng mã xác thực."),
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  // Thiếu email thì chưa có gì để xác thực: quay về bước nhập email.
  beforeLoad: ({ search }) => {
    if (!search.email || validateEmail(search.email)) throw redirect({ to: "/forgot-password" });
  },
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { email } = Route.useSearch();
  return <ResetPasswordPage email={email ?? ""} />;
}
