import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { TransactionsPage } from "@/pages/transactions";

export const Route = createFileRoute("/transactions")({
  head: seo("Giao dịch & đối soát", "Tra cứu giao dịch và xác nhận đối soát."),
  // `?rec=false` mở sẵn danh sách chưa đối soát (đi từ việc cần làm ở trang tổng quan).
  // Router đọc `false` trên URL thành boolean nên phải đổi về chuỗi để khớp giá trị của bộ lọc.
  validateSearch: (search: Record<string, unknown>): { rec?: string } => ({
    rec: search.rec === undefined ? undefined : String(search.rec),
  }),
  component: TransactionsRoute,
});

function TransactionsRoute() {
  const { rec } = Route.useSearch();
  return <TransactionsPage initialRec={rec} />;
}
