import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/pages/transactions/transactions.constants";
import type { TransactionFilters as Filters } from "@/pages/transactions/transactions.types";

export function TransactionFilters({
  filters,
  badRange,
  onFiltersChange,
}: {
  filters: Filters;
  badRange: boolean;
  onFiltersChange: (filters: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch });
  return (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="txn-q" className="text-xs">
            Mã giao dịch cổng thanh toán
          </Label>
          <Input
            id="txn-q"
            className="w-48"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="txn-from" className="text-xs">
            Từ ngày
          </Label>
          <Input
            id="txn-from"
            type="date"
            className="w-40"
            value={filters.from}
            aria-invalid={badRange}
            aria-describedby={badRange ? "txn-range-error" : undefined}
            onChange={(e) => set({ from: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="txn-to" className="text-xs">
            Đến ngày
          </Label>
          <Input
            id="txn-to"
            type="date"
            className="w-40"
            value={filters.to}
            aria-invalid={badRange}
            aria-describedby={badRange ? "txn-range-error" : undefined}
            onChange={(e) => set({ to: e.target.value })}
          />
        </div>
        <Select
          value={filters.purpose}
          onValueChange={(v) => set({ purpose: v as Filters["purpose"] })}
        >
          <SelectTrigger className="w-44" aria-label="Dịch vụ">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi dịch vụ</SelectItem>
            {Object.entries(PAYMENT_PURPOSE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(v) => set({ status: v as Filters["status"] })}
        >
          <SelectTrigger className="w-40" aria-label="Trạng thái">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            {Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div role="status">
        {badRange && (
          <p id="txn-range-error" className="text-xs text-destructive">
            Ngày bắt đầu phải trước ngày kết thúc
          </p>
        )}
      </div>
    </div>
  );
}
