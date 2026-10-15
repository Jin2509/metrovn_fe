import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REVENUE_METHOD_OPTIONS, REVENUE_SERVICE_OPTIONS } from "@/pages/revenue/revenue.constants";
import type { RevenueFilters as RevenueFiltersState } from "@/pages/revenue/revenue.types";

export function RevenueFilters({
  filters,
  onFiltersChange,
}: {
  filters: RevenueFiltersState;
  onFiltersChange: (filters: RevenueFiltersState) => void;
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
        value={filters.service}
        onValueChange={(service) => onFiltersChange({ ...filters, service })}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REVENUE_SERVICE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.method}
        onValueChange={(method) => onFiltersChange({ ...filters, method })}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REVENUE_METHOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
