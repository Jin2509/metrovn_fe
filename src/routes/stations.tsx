import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { StationsPage } from "@/pages/stations";

export const Route = createFileRoute("/stations")({
  head: seo("Ga & tuyến", "Danh sách ga, trạm buýt gần ga, thứ tự ga và kết cấu từng tuyến."),
  validateSearch: tabSearch,
  component: StationsPage,
});
