import { createFileRoute } from "@tanstack/react-router";
import { StationsPage } from "@/pages/stations";

export const Route = createFileRoute("/stations")({
  head: () => ({
    meta: [
      { title: "Quản lý ga · Metro Admin" },
      {
        name: "description",
        content: "Danh sách ga Metro, tọa độ, trạng thái và trạm buýt gần ga.",
      },
      { property: "og:title", content: "Quản lý ga · Metro Admin" },
      { property: "og:description", content: "Danh sách ga và trạm buýt gần ga." },
    ],
  }),
  component: StationsPage,
});
