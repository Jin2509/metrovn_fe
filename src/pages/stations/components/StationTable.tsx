import { Plus } from "lucide-react";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StationApiStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { lineColor } from "@/pages/stations/hooks/useNetwork";
import { STATION_STATUS_LABELS } from "@/pages/stations/stations.service";
import type { StationListRow, StationStatusFilter } from "@/pages/stations/stations.types";

export function StationTable({
  rows,
  total,
  loading,
  query,
  onQueryChange,
  status,
  onStatusChange,
  selectedId,
  onSelect,
  onCreate,
}: {
  rows: StationListRow[];
  total: number;
  loading: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  status: StationStatusFilter;
  onStatusChange: (s: StationStatusFilter) => void;
  selectedId?: number;
  onSelect: (id: number) => void;
  /** Bỏ trống khi người dùng không có quyền STATION_MANAGE. */
  onCreate?: () => void;
}) {
  return (
    <Section
      title="Danh sách ga"
      description={loading ? "Đang tải…" : `${total} ga trong hệ thống`}
      action={
        onCreate && (
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Thêm ga
          </Button>
        )
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          placeholder="Tìm mã, tên ga, quận…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={(v) => onStatusChange(v as StationStatusFilter)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            {(Object.keys(STATION_STATUS_LABELS) as StationApiStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATION_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        rows={rows}
        pageSize={12}
        onRow={(r) => onSelect(r.id)}
        empty={loading ? "Đang tải danh sách ga…" : "Không có ga phù hợp"}
        cols={[
          { h: "Mã", c: (r) => <span className="font-mono text-xs">{r.code}</span> },
          {
            h: "Tên ga",
            c: (r) => (
              <span className={cn("font-medium", r.id === selectedId && "text-primary")}>
                {r.nameStation}
                {r.isInterchange && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    (chuyển tuyến)
                  </span>
                )}
              </span>
            ),
          },
          { h: "Quận", c: (r) => r.district || "—" },
          {
            h: "Tuyến",
            c: (r) => (
              <div className="flex gap-1">
                {r.lines.map((l) => (
                  <span
                    key={l.id}
                    className="h-3 w-3 rounded-full"
                    style={{ background: lineColor(l) }}
                    title={l.code}
                  />
                ))}
                {!r.lines.length && <span className="text-xs text-muted-foreground">Chưa gắn</span>}
              </div>
            ),
          },
          {
            h: "Trạng thái",
            c: (r) => <StatusBadge s={r.status} label={STATION_STATUS_LABELS[r.status]} />,
          },
        ]}
      />
    </Section>
  );
}
