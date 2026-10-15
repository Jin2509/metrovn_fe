import { createFileRoute } from "@tanstack/react-router";
import { BusesPage } from "@/pages/buses";

export const Route = createFileRoute("/buses")({
  head: () => ({
    meta: [
      { title: "Liên kết xe buýt · Metro Admin" },
      { name: "description", content: "Các tuyến xe buýt kết nối với ga Metro TP.HCM." },
      { property: "og:title", content: "Liên kết xe buýt · Metro Admin" },
      { property: "og:description", content: "Tuyến xe buýt kết nối ga Metro." },
    ],
  }),
  component: BusesPage,
});
