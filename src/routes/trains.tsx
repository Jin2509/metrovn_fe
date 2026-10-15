import { createFileRoute } from "@tanstack/react-router";
import { TrainsPage } from "@/pages/trains";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/trains")({
  head: seo("Tàu & vận hành", "Danh sách đoàn tàu và cấu hình vận hành theo phiên bản."),
  component: TrainsPage,
});
