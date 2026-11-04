import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { ReportsPage } from "@/pages/reports";

export const Route = createFileRoute("/reports")({
  head: seo(
    "Thống kê & báo cáo",
    "Doanh thu và lưu lượng hành khách của toàn mạng lưới và từng ga.",
  ),
  component: ReportsPage,
});
