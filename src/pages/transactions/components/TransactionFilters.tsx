import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSACTION_FILTER_OPTIONS } from "@/pages/transactions/transactions.constants";
import type {
  TransactionFilterKey,
  TransactionFilters as TransactionFiltersState,
} from "@/pages/transactions/transactions.types";

export function TransactionFilters({
  filters,
  onFiltersChange,
}: {
  filters: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
}) {
  const selectFilter = (key: TransactionFilterKey, width = "w-40") => (
    <Select
      value={filters[key]}
      onValueChange={(value) => onFiltersChange({ ...filters, [key]: value })}
    >
      <SelectTrigger className={width}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TRANSACTION_FILTER_OPTIONS[key].map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <Input
        placeholder="Mã GD / đơn hàng"
        className="w-44"
        value={filters.q}
        onChange={(event) => onFiltersChange({ ...filters, q: event.target.value })}
      />
      <Input
        type="date"
        className="w-40"
        value={filters.from}
        onChange={(event) => onFiltersChange({ ...filters, from: event.target.value })}
      />
      <Input
        type="date"
        className="w-40"
        value={filters.to}
        onChange={(event) => onFiltersChange({ ...filters, to: event.target.value })}
      />
      {selectFilter("status")}
      {selectFilter("method")}
      {selectFilter("gateway", "w-32")}
      {selectFilter("rec")}
    </div>
  );
}
