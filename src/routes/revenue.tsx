import { createFileRoute } from "@tanstack/react-router";
import { RevenuePage } from "@/pages/revenue";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/revenue")({
  head: seo(
    "Thống kê doanh thu",
    "Thống kê doanh thu theo thời gian, dịch vụ và phương thức thanh toán.",
  ),
  component: RevenuePage,
});
