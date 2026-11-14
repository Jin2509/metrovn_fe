import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, LoadState, money, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { apiErrorMessage, paymentsApi, type PaymentView } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtInstant } from "@/lib/query-sync";
import { periodsStore } from "@/stores/admin";
import { useTodayReports } from "@/pages/dashboard/dashboard.data";
import {
  KpiStrip,
  RevenueChart,
  SeeAll,
  TaskList,
} from "@/pages/dashboard/components/DashboardWidgets";
import { REFUNDS_KEY } from "@/pages/transactions/transactions.service";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_PURPOSE_LABEL,
} from "@/pages/transactions/transactions.constants";

/** Kế toán: xác nhận hoàn tiền ngay tại đây; đối soát SePay ở trang Giao dịch. */
export function AccountantDashboard() {
  const queryClient = useQueryClient();
  const canPay = useAuth().hasPermission("PAYMENT_MANAGE");
  const report = useTodayReports();
  const refunds = useQuery({
    queryKey: REFUNDS_KEY,
    queryFn: () => paymentsApi.byStatus({ status: "REFUND_PENDING", size: 50 }),
    enabled: canPay,
    retry: false,
  });
  const [pending, setPending] = useState("");
  const rows = refunds.data?.content ?? [];
  const refundTotal = rows.reduce((sum, p) => sum + p.amountVnd, 0);
  const openPeriods = periodsStore.use().filter((p) => !p.closed);

  const confirm = async (p: PaymentView) => {
    setPending(p.id);
    try {
      await paymentsApi.confirmRefunded(p.id);
      toast.success("Đã xác nhận hoàn tiền");
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPending("");
    }
  };

  return (
    <>
      <KpiStrip
        items={[
          { label: "Doanh thu hôm nay", value: report.revenueText },
          { label: "Giao dịch hôm nay", value: report.paymentsText },
          {
            label: "Chờ hoàn tiền",
            value: canPay ? rows.length : "—",
            hint: canPay ? money(refundTotal) : undefined,
          },
          { label: "Kỳ chưa chốt sổ", value: openPeriods.length },
        ]}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        {canPay && (
          <Section
            className="min-w-0"
            title={`Chờ hoàn tiền (${rows.length})`}
            action={<SeeAll to="/transactions">Đối soát SePay</SeeAll>}
          >
            <LoadState
              loading={refunds.isPending}
              error={refunds.error ? apiErrorMessage(refunds.error) : ""}
            />
            <DataTable
              rows={rows}
              rowKey={(p) => p.id}
              pageSize={8}
              empty="Không có giao dịch chờ hoàn tiền."
              cols={[
                {
                  h: "Thời gian",
                  c: (p) => <span className="whitespace-nowrap">{fmtInstant(p.createdAt)}</span>,
                },
                { h: "Dịch vụ", c: (p) => PAYMENT_PURPOSE_LABEL[p.purpose] },
                { h: "Phương thức", c: (p) => PAYMENT_METHOD_LABEL[p.method] },
                { h: "Số tiền", className: "text-right", c: (p) => money(p.amountVnd) },
                {
                  h: "Thao tác",
                  className: "w-28 text-right",
                  c: (p) => (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!pending}
                      onClick={() => void confirm(p)}
                    >
                      Đã hoàn tiền
                    </Button>
                  ),
                },
              ]}
            />
          </Section>
        )}
        <div className="min-w-0 space-y-6">
          <TaskList
            tasks={[
              { label: "Giao dịch chờ hoàn tiền", count: rows.length, to: "/transactions" },
              { label: "Kỳ chưa chốt sổ", count: openPeriods.length, to: "/period-closing" },
            ]}
          />
          {report.canRevenue && (
            <RevenueChart
              rows={report.week}
              loading={report.weekLoading}
              error={report.weekError}
            />
          )}
        </div>
      </div>
    </>
  );
}
