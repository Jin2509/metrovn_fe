import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { NotificationsPage } from "@/pages/notifications";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/notifications")({
  head: seo(
    "Thông báo vận hành",
    "Soạn và gửi thông báo vận hành tới hành khách, nhân viên nhà ga, kế toán.",
  ),
  validateSearch: tabSearch,
  component: NotificationsPage,
});
