import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { IncidentsPage } from "@/pages/incidents";

export const Route = createFileRoute("/incidents")({
  head: seo("Sự cố tại ga", "Theo dõi và xử lý sự cố do nhân viên ga báo từ ứng dụng."),
  component: IncidentsPage,
});
