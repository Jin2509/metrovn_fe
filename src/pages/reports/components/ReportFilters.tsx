import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MetroLine, Station } from "@/mocks/metro";
import { REPORT_METRICS } from "@/pages/reports/reports.constants";
import type { ReportFilters as Filters, ReportMetric } from "@/pages/reports/reports.types";

export function ReportFilters({
  lines,
  stations,
  filters,
  onFiltersChange,
  metric,
  onMetricChange,
}: {
  lines: MetroLine[];
  stations: Station[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  metric: ReportMetric;
  onMetricChange: (metric: ReportMetric) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        aria-label="Từ ngày"
        className="w-40"
        value={filters.from}
        onChange={(event) => onFiltersChange({ ...filters, from: event.target.value })}
      />
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
      <Input
        type="date"
        aria-label="Đến ngày"
        className="w-40"
        value={filters.to}
        onChange={(event) => onFiltersChange({ ...filters, to: event.target.value })}
      />
      <Select
        value={filters.lineId}
        onValueChange={(lineId) => onFiltersChange({ ...filters, lineId })}
      >
        <SelectTrigger className="w-44" aria-label="Lọc theo tuyến">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Toàn mạng lưới</SelectItem>
          {lines.map((line) => (
            <SelectItem key={line.id} value={line.id}>
              {line.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.stationId}
        onValueChange={(stationId) => onFiltersChange({ ...filters, stationId })}
      >
        <SelectTrigger className="w-52" aria-label="Lọc theo ga">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả các ga</SelectItem>
          {stations.map((station) => (
            <SelectItem key={station.id} value={station.id}>
              {station.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ToggleGroup
        type="single"
        variant="outline"
        value={metric}
        onValueChange={(value) => value && onMetricChange(value as ReportMetric)}
        className="sm:ml-auto"
        aria-label="Loại thống kê"
      >
        {REPORT_METRICS.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="px-3">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
