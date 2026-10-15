import { createFileRoute } from "@tanstack/react-router";
import { PromotionsPage } from "@/pages/promotions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/promotions")({
  head: seo("Khuyến mãi", "Tạo và quản lý chương trình khuyến mãi."),
  component: PromotionsPage,
});
