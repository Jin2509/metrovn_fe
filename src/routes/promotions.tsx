import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { PromotionsPage } from "@/pages/promotions";

export const Route = createFileRoute("/promotions")({
  head: seo("Ưu đãi & thành viên", "Chương trình khuyến mãi và cấu hình hạng thành viên."),
  validateSearch: tabSearch,
  component: PromotionsPage,
});
