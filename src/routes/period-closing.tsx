import { createFileRoute } from "@tanstack/react-router";
import { PeriodClosingPage } from "@/pages/periodclosing";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/period-closing")({
  head: seo("Chốt kỳ", "Tổng hợp doanh thu, hoàn tiền, khuyến mãi theo tháng và chốt kỳ."),
  component: PeriodClosingPage,
});
