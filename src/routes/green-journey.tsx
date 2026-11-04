import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { GreenJourneyPage } from "@/pages/green";

export const Route = createFileRoute("/green-journey")({
  head: seo(
    "Hành trình xanh",
    "Cấu hình CPoint, nâng hạng thành viên và chính sách áp dụng ưu đãi.",
  ),
  validateSearch: tabSearch,
  component: GreenJourneyPage,
});
