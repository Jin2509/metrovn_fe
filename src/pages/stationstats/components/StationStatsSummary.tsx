import { Activity, Crown, TrendingUp, Wallet } from "lucide-react";
import { StatCard, money } from "@/components/shared";
import type { StationStatRow, StationStatsTotals } from "@/pages/stationstats/stationstats.types";

export function StationStatsSummary({
  totals,
  topRevenue,
  topFlow,
}: {
  totals: StationStatsTotals;
  topRevenue: StationStatRow | undefined;
  topFlow: StationStatRow | undefined;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Tổng doanh thu"
        icon={Wallet}
        value={money(totals.revenue)}
        hint={`Thuần ${money(totals.netRevenue)} · ${totals.stationCount} ga · ${totals.days} ngày`}
      />
      <StatCard
        label="Tổng lưu lượng"
        icon={Activity}
        tone="success"
        value={totals.flow.toLocaleString("vi-VN")}
        hint={`Vào ${totals.entries.toLocaleString("vi-VN")} · Ra ${totals.exits.toLocaleString("vi-VN")}`}
      />
      <StatCard
        label="Ga dẫn đầu doanh thu"
        icon={Crown}
        tone="accent"
        value={topRevenue?.name ?? "—"}
        hint={topRevenue && money(topRevenue.revenue)}
      />
      <StatCard
        label="Ga đông khách nhất"
        icon={TrendingUp}
        tone="muted"
        value={topFlow?.name ?? "—"}
        hint={topFlow && `${topFlow.avgDailyFlow.toLocaleString("vi-VN")} lượt/ngày`}
      />
    </div>
  );
}
