import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/pages/transactions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/transactions")({
  head: seo("Giao dịch", "Tra cứu giao dịch thanh toán toàn hệ thống."),
  component: TransactionsPage,
});
