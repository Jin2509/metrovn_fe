import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsPage } from "@/pages/approvals";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/approvals")({
  head: seo("Hộp phê duyệt", "Manager phê duyệt hoặc từ chối thay đổi do Admin đề xuất."),
  component: ApprovalsPage,
});
