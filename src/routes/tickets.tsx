import { createFileRoute } from "@tanstack/react-router";
import { TicketsPage } from "@/pages/tickets";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/tickets")({
  head: seo("Loại vé & giá vé", "Quản lý loại vé và bảng giá theo khoảng cách."),
  component: TicketsPage,
});
