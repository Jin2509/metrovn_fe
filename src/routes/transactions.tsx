import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { TransactionsPage } from "@/pages/transactions";

export const Route = createFileRoute("/transactions")({
  head: seo("Giao dịch & đối soát", "Tra cứu giao dịch, đối soát SePay và xác nhận hoàn tiền."),
  component: TransactionsPage,
});
