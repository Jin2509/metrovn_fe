import { DataTable, money, Section, type Col } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { metricValue, rankOf } from "@/pages/reports/reports.service";
import type { ReportMetric, StationReportRow } from "@/pages/reports/reports.types";

const count = (value: number) => value.toLocaleString("vi-VN");
const right = "text-right";

const COLUMNS: Record<ReportMetric, Col<StationReportRow>[]> = {
  revenue: [
    { h: "Vé", c: (row) => money(row.ticketRevenue), className: right },
    { h: "Gửi xe", c: (row) => money(row.parkingRevenue), className: right },
    { h: "Hoàn tiền", c: (row) => money(row.refund), className: right },
    { h: "Thuần", c: (row) => <b>{money(row.netRevenue)}</b>, className: right },
    { h: "Giao dịch", c: (row) => count(row.transactions), className: right },
  ],
  flow: [
    { h: "Lượt vào", c: (row) => count(row.entries), className: right },
    { h: "Lượt ra", c: (row) => count(row.exits), className: right },
    { h: "Tổng", c: (row) => <b>{count(row.flow)}</b>, className: right },
    { h: "TB lượt/ngày", c: (row) => count(row.avgDailyFlow), className: right },
  ],
};

/** Bảng theo từng ga, thay luôn biểu đồ xếp hạng: thứ tự là hạng, cột tỉ trọng cho thấy độ chênh. */
export function StationReportTable({
  rows,
  metric,
  focusId,
  onToggle,
}: {
  /** Đã sắp xếp theo `metric`. */
  rows: StationReportRow[];
  metric: ReportMetric;
  focusId: string;
  onToggle: (stationId: string) => void;
}) {
  const total = rows.reduce((sum, row) => sum + metricValue(row, metric), 0);
  return (
    <Section
      title={`Theo từng ga, xếp theo ${metric === "revenue" ? "doanh thu" : "lưu lượng"}`}
      description="Bấm một ga để xem riêng ga đó, bấm lại để bỏ chọn. Không có thông tin cá nhân hành khách."
    >
      <DataTable
        rows={rows}
        pageSize={15}
        onRow={(row) => onToggle(row.stationId)}
        empty="Không có ga phù hợp"
        cols={[
          { h: "Hạng", c: (row) => `#${rankOf(row, metric)}`, className: "w-14" },
          {
            h: "Ga",
            c: (row) => (
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {row.name}
                {row.stationId === focusId && <Badge>Đang xem</Badge>}
                {row.interchange && <Badge variant="secondary">Chuyển tuyến</Badge>}
              </span>
            ),
          },
          ...COLUMNS[metric],
          {
            h: "Tỉ trọng",
            className: "w-36",
            c: (row) => {
              const share = total ? (metricValue(row, metric) / total) * 100 : 0;
              return (
                <span className="flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-xs tabular-nums">{share.toFixed(1)}%</span>
                </span>
              );
            },
          },
        ]}
      />
    </Section>
  );
}
