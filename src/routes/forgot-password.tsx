import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { ForgotPasswordPage } from "@/pages/forgotpassword";

export const Route = createFileRoute("/forgot-password")({
  head: seo("Quên mật khẩu", "Yêu cầu mã xác thực để đặt lại mật khẩu tài khoản Metro TP.HCM."),
  component: ForgotPasswordPage,
});
