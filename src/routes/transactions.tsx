import { createFileRoute } from "@tanstack/react-router";
import { tabSearch } from "@/components/app-shell";
import { seo } from "@/lib/seo";
import { TransactionsPage } from "@/pages/transactions";

export const Route = createFileRoute("/transactions")({
  head: seo("Giao dịch & đối soát", "Tra cứu giao dịch và đối soát với cổng thanh toán."),
  validateSearch: tabSearch,
  component: TransactionsPage,
});
