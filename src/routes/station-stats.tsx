import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { StationStatsPage } from "@/pages/stationstats";

export const Route = createFileRoute("/station-stats")({
  head: seo("Thống kê vận hành", "Doanh thu, lưu lượng theo ga và theo khung giờ."),
  validateSearch: tabSearch,
  component: StationStatsPage,
});
