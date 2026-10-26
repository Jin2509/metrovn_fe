import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { DashboardPage } from "@/pages/dashboard";

export const Route = createFileRoute("/")({
  head: seo(
    "Tổng quan",
    "Bảng điều khiển quản trị Metro: doanh thu, lưu lượng, bản đồ và kết nối xe buýt.",
  ),
  component: DashboardPage,
});
