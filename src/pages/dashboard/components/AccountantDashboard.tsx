import {
  AlertCircle,
  CalendarClock,
  Clock,
  FileWarning,
  RotateCcw,
  Scale,
  Wallet,
} from "lucide-react";
import { DataTable, Section, StatCard, StatusBadge, money } from "@/components/shared";
import { periodsStore, txnStore } from "@/mocks/admin";
import { QuickLinks, RevenueChart, TaskList } from "@/pages/dashboard/components/DashboardWidgets";

/** Kế toán: giao dịch, đối soát, hoàn tiền và chốt kỳ. */
export function AccountantDashboard() {
  const txns = txnStore.use();
  const periods = periodsStore.use();
  const unreconciled = txns.filter((t) => t.status === "SUCCESS" && !t.reconciled);
  const failed = txns.filter((t) => t.status === "FAILED").length;
  const processing = txns.filter((t) => t.status === "PENDING").length;
  const refunded = txns.reduce((a, t) => a + t.refund, 0);
  const openPeriods = periods.filter((p) => !p.closed);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doanh thu hôm nay"
          value="512,4 triệu ₫"
          hint="Trước hoàn tiền"
          icon={Wallet}
        />
        <StatCard
          label="Chưa đối soát"
          value={unreconciled.length}
          hint={money(unreconciled.reduce((a, t) => a + t.amount, 0))}
          icon={Scale}
          tone="accent"
        />
        <StatCard
          label="Giao dịch lỗi"
          value={failed}
          hint="14 ngày gần nhất"
          icon={AlertCircle}
          tone="destructive"
        />
        <StatCard
          label="Đã hoàn tiền"
          value={money(refunded)}
          hint="14 ngày gần nhất"
          icon={RotateCcw}
          tone="muted"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <TaskList
          tasks={[
            {
              label: "Giao dịch cần đối soát",
              hint: "Thành công nhưng chưa khớp với cổng thanh toán",
              count: unreconciled.length,
              icon: Scale,
              to: "/transactions",
              tab: "reconciliation",
              tone: "accent",
            },
            {
              label: "Giao dịch đang xử lý",
              hint: "Chờ cổng thanh toán trả kết quả",
              count: processing,
              icon: Clock,
              to: "/transactions",
            },
            {
              label: "Giao dịch lỗi cần kiểm tra",
              hint: "Kiểm tra hành khách có bị trừ tiền không",
              count: failed,
              icon: FileWarning,
              to: "/transactions",
              tone: "destructive",
            },
            {
              label: "Kỳ chưa chốt sổ",
              hint: openPeriods.map((p) => `Tháng ${p.month}`).join(", ") || "Đã chốt hết",
              count: openPeriods.length,
              icon: CalendarClock,
              to: "/period-closing",
              tone: "accent",
            },
          ]}
        />
        <RevenueChart />
      </div>

      <Section
        title="Giao dịch chưa đối soát gần nhất"
        description="Ưu tiên xử lý trước khi chốt kỳ"
      >
        <DataTable
          rows={unreconciled}
          pageSize={6}
          cols={[
            { h: "Mã GD", c: (t) => <span className="font-mono text-xs">{t.id}</span> },
            { h: "Thời gian", c: (t) => t.at },
            { h: "Dịch vụ", c: (t) => t.service },
            { h: "Cổng", c: (t) => t.gateway },
            { h: "Số tiền", className: "text-right", c: (t) => money(t.amount) },
            { h: "Trạng thái", c: () => <StatusBadge s="UNRECONCILED" /> },
          ]}
        />
      </Section>
      <QuickLinks />
    </>
  );
}
