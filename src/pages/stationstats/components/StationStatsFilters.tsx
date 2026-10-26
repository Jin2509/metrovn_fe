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
import type { MetroLine } from "@/mocks/metro";
import { STATION_STATS_METRICS } from "@/pages/stationstats/stationstats.constants";
import type {
  StationStatsFilters as StationStatsFiltersState,
  StationStatsMetric,
} from "@/pages/stationstats/stationstats.types";

export function StationStatsFilters({
  lines,
  filters,
  onFiltersChange,
  metric,
  onMetricChange,
}: {
  lines: MetroLine[];
  filters: StationStatsFiltersState;
  onFiltersChange: (filters: StationStatsFiltersState) => void;
  metric: StationStatsMetric;
  onMetricChange: (metric: StationStatsMetric) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        className="w-40"
        value={filters.from}
        onChange={(event) => onFiltersChange({ ...filters, from: event.target.value })}
      />
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
      <Input
        type="date"
        className="w-40"
        value={filters.to}
        onChange={(event) => onFiltersChange({ ...filters, to: event.target.value })}
      />
      <Select
        value={filters.lineId}
        onValueChange={(lineId) => onFiltersChange({ ...filters, lineId })}
      >
        <SelectTrigger className="w-48">
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
      <ToggleGroup
        type="single"
        variant="outline"
        value={metric}
        onValueChange={(value) => value && onMetricChange(value as StationStatsMetric)}
        className="ml-auto"
      >
        {STATION_STATS_METRICS.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="px-3">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
