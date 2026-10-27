import { createFileRoute } from "@tanstack/react-router";
import { TrainsPage } from "@/pages/trains";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/trains")({
  head: seo(
    "Tàu & vận hành",
    "Đội tàu, cấu hình giờ chạy và giãn cách, kiểm tra số tàu cần cho mỗi phiên bản.",
  ),
  component: TrainsPage,
});
