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
        Doanh thu theo báo cáo backend. Chốt kỳ hiện chỉ lưu trên trình duyệt này.
      </p>
      <DataTable
        rows={periods}
        cols={[
          { h: "Kỳ", c: (period) => <b>{period.month}</b> },
          {
            h: "Doanh thu",
            className: "text-right",
            c: (period) => <b>{money(period.revenue)}</b>,
          },
          {
            h: "Số giao dịch",
            className: "text-right",
            c: (period) => period.transactions.toLocaleString("vi-VN"),
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
