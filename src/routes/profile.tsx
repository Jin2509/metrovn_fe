import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { ProfilePage } from "@/pages/profile";

export const Route = createFileRoute("/profile")({
  head: seo("Cài đặt tài khoản", "Hồ sơ, đổi mật khẩu, tùy chọn thông báo và giao diện."),
  component: ProfilePage,
});
