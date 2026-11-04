import { toast } from "sonner";
import { DataTable, money, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { periodsStore, txnStore } from "@/mocks/admin";
import {
  KpiStrip,
  RevenueChart,
  SeeAll,
  TaskList,
} from "@/pages/dashboard/components/DashboardWidgets";
import { isReconcilable, reconcileTransactions } from "@/pages/transactions/transactions.service";

/** Kế toán: đối soát từng giao dịch ngay tại đây; xử lý hàng loạt ở trang Giao dịch. */
export function AccountantDashboard() {
  const txns = txnStore.use();
  const periods = periodsStore.use();
  const closedMonths = periods.filter((p) => p.closed).map((p) => p.month);
  const unreconciled = txns.filter((t) => isReconcilable(t, closedMonths));
  const failed = txns.filter((t) => t.status === "FAILED").length;
  const processing = txns.filter((t) => t.status === "PENDING").length;
  const refunded = txns.reduce((a, t) => a + t.refund, 0);
  const openPeriods = periods.filter((p) => !p.closed);

  return (
    <>
      <KpiStrip
        items={[
          { label: "Doanh thu hôm nay", value: "512,4 triệu VND" },
          {
            label: "Chưa đối soát",
            value: unreconciled.length,
            hint: money(unreconciled.reduce((a, t) => a + t.amount, 0)),
          },
          { label: "Giao dịch lỗi", value: failed, hint: "14 ngày gần nhất" },
          { label: "Đã hoàn tiền", value: money(refunded), hint: "14 ngày gần nhất" },
        ]}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Section
          className="min-w-0"
          title={`Chờ đối soát (${unreconciled.length})`}
          action={<SeeAll to="/transactions">Đối soát hàng loạt</SeeAll>}
        >
          <DataTable
            rows={unreconciled}
            pageSize={8}
            empty="Đã đối soát hết."
            cols={[
              { h: "Mã GD", c: (t) => t.id },
              { h: "Thời gian", c: (t) => <span className="whitespace-nowrap">{t.at}</span> },
              { h: "Cổng", c: (t) => t.gateway },
              { h: "Số tiền", className: "text-right", c: (t) => money(t.amount) },
              {
                h: "Thao tác",
                className: "w-24 text-right",
                c: (t) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      reconcileTransactions([t.id]);
                      toast.success(`Đã đối soát ${t.id}`);
                    }}
                  >
                    Đã khớp
                  </Button>
                ),
              },
            ]}
          />
        </Section>
        <div className="min-w-0 space-y-6">
          <TaskList
            tasks={[
              { label: "Giao dịch đang xử lý", count: processing, to: "/transactions" },
              { label: "Giao dịch lỗi cần kiểm tra", count: failed, to: "/transactions" },
              { label: "Kỳ chưa chốt sổ", count: openPeriods.length, to: "/period-closing" },
            ]}
          />
          <RevenueChart />
        </div>
      </div>
    </>
  );
}
