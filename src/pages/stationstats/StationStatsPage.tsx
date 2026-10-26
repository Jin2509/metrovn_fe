import { Activity, BarChart3 } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { PassengerFlowPanel } from "@/pages/passengerflow";
import { Section } from "@/components/shared";
import { StationRankingChart } from "@/pages/stationstats/components/StationRankingChart";
import { StationStatsFilters } from "@/pages/stationstats/components/StationStatsFilters";
import { StationStatsSummary } from "@/pages/stationstats/components/StationStatsSummary";
import { StationStatsTable } from "@/pages/stationstats/components/StationStatsTable";
import { StationTrendChart } from "@/pages/stationstats/components/StationTrendChart";
import { useStationStats } from "@/pages/stationstats/hooks/useStationStats";

function StationStatsPanel() {
  const {
    lines,
    filters,
    setFilters,
    focusStation,
    metric,
    setMetric,
    query,
    setQuery,
    report,
    rows,
    focusStationName,
  } = useStationStats();
  const { invalid, totals, trend } = report;
  const topRevenue = report.rows.find((row) => row.revenueRank === 1);
  const topFlow = report.rows.find((row) => row.flowRank === 1);

  return (
    <>
      <StationStatsFilters
        lines={lines}
        filters={filters}
        onFiltersChange={setFilters}
        metric={metric}
        onMetricChange={setMetric}
      />
      {invalid && <p className="text-sm text-destructive">Khoảng thời gian không hợp lệ</p>}
      {!invalid && !totals.days ? (
        <Section title="Kết quả">
          <p className="py-10 text-center text-muted-foreground">Không có dữ liệu</p>
        </Section>
      ) : (
        !invalid && (
          <>
            <StationStatsSummary totals={totals} topRevenue={topRevenue} topFlow={topFlow} />
            <div className="grid gap-6 xl:grid-cols-2">
              <StationRankingChart
                rows={rows}
                metric={metric}
                focusStationId={filters.focusStationId}
                onSelectStation={focusStation}
              />
              <StationTrendChart
                data={trend}
                stationName={focusStationName}
                onReset={() => focusStation("ALL")}
              />
            </div>
            <StationStatsTable
              rows={rows}
              query={query}
              onQueryChange={setQuery}
              onSelectStation={focusStation}
            />
          </>
        )
      )}
    </>
  );
}

export function StationStatsPage() {
  const { can } = useAuth();

  return (
    <AppShell title="Thống kê vận hành">
      <PageTabs
        tabs={[
          { value: "stations", label: "Theo ga", icon: BarChart3, content: <StationStatsPanel /> },
          {
            value: "hourly",
            label: "Lưu lượng theo giờ",
            icon: Activity,
            content: <PassengerFlowPanel />,
            hidden: !can("stats.hourlyFlow"),
          },
        ]}
      />
    </AppShell>
  );
}
