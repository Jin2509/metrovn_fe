import { StatCard, money } from "@/components/shared";

export function RevenueStats({
  total,
  refund,
  net,
  count,
}: {
  total: number;
  refund: number;
  net: number;
  count: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <StatCard label="Tổng doanh thu" value={money(total)} />
      <StatCard label="Hoàn tiền" value={money(refund)} />
      <StatCard label="Doanh thu thuần" value={money(net)} />
      <StatCard label="Số giao dịch" value={count} />
    </div>
  );
}
