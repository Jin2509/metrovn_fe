import { createFileRoute } from "@tanstack/react-router";
import { PoliciesPage } from "@/pages/policies";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/policies")({
  head: seo(
    "Chính sách đang áp dụng",
    "Tổng hợp bảng giá, thời hạn vé, hạng thành viên, giờ vận hành.",
  ),
  component: PoliciesPage,
});
