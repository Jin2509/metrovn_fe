import { createFileRoute } from "@tanstack/react-router";
import { ReconciliationPage } from "@/pages/reconciliation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/reconciliation")({
  head: seo("Đối soát", "Đối soát giao dịch chưa đối soát theo khoảng ngày."),
  component: ReconciliationPage,
});
