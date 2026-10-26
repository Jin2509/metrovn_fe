import { Receipt, RotateCcw, Wallet, WalletCards } from "lucide-react";
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Tổng doanh thu" value={money(total)} icon={Wallet} />
      <StatCard label="Hoàn tiền" value={money(refund)} icon={RotateCcw} tone="destructive" />
      <StatCard label="Doanh thu thuần" value={money(net)} icon={WalletCards} tone="success" />
      <StatCard label="Số giao dịch" value={count} icon={Receipt} tone="muted" />
    </div>
  );
}
