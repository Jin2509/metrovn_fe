import { createFileRoute } from "@tanstack/react-router";
import { PeriodClosingPage } from "@/pages/periodclosing";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/period-closing")({
  head: seo("Chốt kỳ", "Tổng hợp doanh thu, hoàn tiền, giảm giá theo tháng và chốt kỳ."),
  component: PeriodClosingPage,
});
