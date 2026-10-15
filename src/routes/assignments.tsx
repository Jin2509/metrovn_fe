import { createFileRoute } from "@tanstack/react-router";
import { AssignmentsPage } from "@/pages/assignments";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/assignments")({
  head: seo("Phân công ga", "Phân công nhân viên phụ trách ga Metro."),
  component: AssignmentsPage,
});
