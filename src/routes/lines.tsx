import { createFileRoute } from "@tanstack/react-router";
import { LinesPage } from "@/pages/lines";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/lines")({
  head: seo("Tuyến & thứ tự ga", "Quản lý tuyến Metro và sắp xếp thứ tự ga."),
  component: LinesPage,
});
