import { createFileRoute } from "@tanstack/react-router";
import { requestSearch } from "@/components/layout/tab-search";
import { seo } from "@/lib/seo";
import { ApprovalsPage } from "@/pages/approvals";

export const Route = createFileRoute("/approvals")({
  head: seo(
    "Hộp yêu cầu",
    "Đề xuất chờ duyệt, yêu cầu giữa Admin và Manager, chính sách đang áp dụng.",
  ),
  validateSearch: requestSearch,
  component: ApprovalsPage,
});
