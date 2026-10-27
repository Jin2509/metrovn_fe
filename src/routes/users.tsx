import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { UsersPage } from "@/pages/users";

export const Route = createFileRoute("/users")({
  head: seo(
    "Tài khoản & phân công",
    "Quản lý nhân sự nội bộ, tài khoản hành khách và phân công nhân viên theo ga.",
  ),
  validateSearch: tabSearch,
  component: UsersPage,
});
