import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { LoginPage } from "@/pages/login";

export const Route = createFileRoute("/login")({
  head: seo("Đăng nhập", "Đăng nhập vào hệ thống quản trị Metro TP.HCM."),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();
  return <LoginPage redirect={redirect} />;
}
