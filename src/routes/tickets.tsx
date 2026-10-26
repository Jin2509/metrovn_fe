import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { TicketsPage } from "@/pages/tickets";

export const Route = createFileRoute("/tickets")({
  head: seo("Giá vé & gửi xe", "Loại vé, giá vé theo cự ly, bãi xe và bảng giá gửi xe."),
  validateSearch: tabSearch,
  component: TicketsPage,
});
