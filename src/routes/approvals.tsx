import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { ApprovalsPage } from "@/pages/approvals";

export const Route = createFileRoute("/approvals")({
  head: seo(
    "Phê duyệt & chính sách",
    "Duyệt các thay đổi giá, vé, vận hành và xem chính sách đang áp dụng.",
  ),
  validateSearch: tabSearch,
  component: ApprovalsPage,
});
