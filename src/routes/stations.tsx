import { createFileRoute } from "@tanstack/react-router";
import { stationSearch } from "@/components/layout/tab-search";
import { seo } from "@/lib/seo";
import { StationsPage } from "@/pages/stations";

export const Route = createFileRoute("/stations")({
  head: seo("Ga & tuyến", "Quản lý nhà ga, thứ tự ga và lý trình từng tuyến Metro."),
  validateSearch: stationSearch,
  component: StationsPage,
});
