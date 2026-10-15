import { createFileRoute } from "@tanstack/react-router";
import { MapPage } from "@/pages/map";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Bản đồ hệ thống · Metro Admin" },
      { name: "description", content: "Bản đồ các tuyến, ga Metro và trạm xe buýt kết nối." },
      { property: "og:title", content: "Bản đồ hệ thống · Metro Admin" },
      { property: "og:description", content: "Bản đồ tuyến, ga Metro và xe buýt kết nối." },
    ],
  }),
  component: MapPage,
});
