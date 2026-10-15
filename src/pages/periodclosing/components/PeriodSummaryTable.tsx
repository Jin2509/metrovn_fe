import { Lock } from "lucide-react";
import { DataTable, money, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Period } from "@/pages/periodclosing/periodclosing.types";

export function PeriodSummaryTable({
  periods,
  onSelectPeriod,
}: {
  periods: Period[];
  onSelectPeriod: (month: string) => void;
}) {
  return (
    <Section title="Tổng hợp theo tháng">
      <p className="mb-3 text-sm text-muted-foreground">
        Sau khi chốt, giao dịch trong kỳ không thể đối soát lại.
      </p>
      <DataTable
        rows={periods}
        cols={[
          { h: "Kỳ", c: (period) => <b>{period.month}</b> },
          { h: "Doanh thu", c: (period) => money(period.revenue) },
          { h: "Hoàn tiền", c: (period) => money(period.refund) },
          { h: "Khuyến mãi", c: (period) => money(period.promo) },
          {
            h: "Thuần",
            c: (period) => <b>{money(period.revenue - period.refund - period.promo)}</b>,
          },
          {
            h: "Trạng thái",
            c: (period) => (
              <StatusBadge
                s={period.closed ? "APPROVED" : "PENDING"}
                label={period.closed ? "Đã chốt" : "Đang mở"}
              />
            ),
          },
          {
            h: "",
            c: (period) =>
              !period.closed && (
                <Button size="sm" onClick={() => onSelectPeriod(period.month)}>
                  <Lock className="h-3.5 w-3.5" />
                  Chốt kỳ
                </Button>
              ),
          },
        ]}
      />
    </Section>
  );
}
