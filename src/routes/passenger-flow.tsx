import { createFileRoute } from "@tanstack/react-router";
import { PassengerFlowPage } from "@/pages/passengerflow";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/passenger-flow")({
  head: seo("Thống kê lưu lượng", "Lưu lượng hành khách theo ga, tuyến và khung giờ."),
  component: PassengerFlowPage,
});
