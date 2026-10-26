import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { UsersPage } from "@/pages/users";

export const Route = createFileRoute("/users")({
  head: seo(
    "Tài khoản & phân công",
    "Quản lý tài khoản nội bộ, khóa/mở, đặt lại mật khẩu và phân công nhân viên theo ga.",
  ),
  validateSearch: tabSearch,
  component: UsersPage,
});
