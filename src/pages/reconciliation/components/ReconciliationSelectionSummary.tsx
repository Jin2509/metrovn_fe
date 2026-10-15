import { money } from "@/components/shared";
import { Button } from "@/components/ui/button";

export function ReconciliationSelectionSummary({
  selectedCount,
  selectedAmount,
  rowCount,
  onSelectAll,
  onConfirm,
}: {
  selectedCount: number;
  selectedAmount: number;
  rowCount: number;
  onSelectAll: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3 text-sm">
      <span>
        Đã chọn <b>{selectedCount}</b> giao dịch · Tổng <b>{money(selectedAmount)}</b>
      </span>
      <Button size="sm" variant="outline" onClick={onSelectAll}>
        Chọn tất cả ({rowCount})
      </Button>
      <Button size="sm" className="ml-auto" disabled={!selectedCount} onClick={onConfirm}>
        Xác nhận “Đã đối soát”
      </Button>
    </div>
  );
}
