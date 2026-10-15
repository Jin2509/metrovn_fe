import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/pages/users";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/users")({
  head: seo("Người dùng", "Quản lý tài khoản người dùng, khóa/mở và đặt lại mật khẩu."),
  component: UsersPage,
});
