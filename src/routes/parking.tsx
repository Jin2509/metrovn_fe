import { createFileRoute } from "@tanstack/react-router";
import { ParkingPage } from "@/pages/parking";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/parking")({
  head: seo("Gửi xe", "Quản lý bãi xe, sức chứa và bảng giá gửi xe."),
  component: ParkingPage,
});
