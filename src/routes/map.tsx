import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { MapPage } from "@/pages/map";

export const Route = createFileRoute("/map")({
  head: seo("Bản đồ & xe buýt", "Bản đồ tuyến, ga Metro và các tuyến xe buýt kết nối."),
  validateSearch: tabSearch,
  component: MapPage,
});
