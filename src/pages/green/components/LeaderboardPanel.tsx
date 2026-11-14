import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable, LoadState, Section } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage, greenJourneyApi } from "@/lib/api";
import { currentMonth, greenKeys } from "@/pages/green/green.service";

const TOP = 20;

/** Bảng xếp hạng điểm xanh theo tháng. Backend chỉ trả tên viết tắt nên không lộ thông tin cá nhân. */
export function LeaderboardPanel() {
  const [month, setMonth] = useState(currentMonth);
  const query = useQuery({
    queryKey: greenKeys.leaderboard(month),
    queryFn: () => greenJourneyApi.leaderboard(month, TOP),
    enabled: /^\d{4}-\d{2}$/.test(month),
    retry: false,
  });
  return (
    <Section
      title={`Top ${TOP} hành khách xanh`}
      action={
        <div className="flex items-center gap-2">
          <Label htmlFor="green-month" className="text-sm">
            Tháng
          </Label>
          <Input
            id="green-month"
            type="month"
            className="w-44"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      }
    >
      <LoadState
        loading={query.isPending && query.fetchStatus !== "idle"}
        error={query.error ? apiErrorMessage(query.error) : ""}
        onRetry={() => void query.refetch()}
      />
      {query.data && (
        <DataTable
          rows={query.data.entries}
          rowKey={(e) => e.rank}
          pageSize={TOP}
          empty="Chưa có chuyến đi xanh trong tháng này"
          cols={[
            { h: "Hạng", c: (e) => <b>#{e.rank}</b> },
            { h: "Hành khách", c: (e) => e.displayName },
            { h: "Điểm xanh", className: "text-right", c: (e) => e.points.toLocaleString("vi-VN") },
            {
              h: "CO₂ tiết kiệm",
              className: "text-right",
              c: (e) => `${e.co2SavedKg.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} kg`,
            },
            { h: "Chuyến", className: "text-right", c: (e) => e.trips },
          ]}
        />
      )}
    </Section>
  );
}
