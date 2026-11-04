import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { approvalLabel, type ApprovalType } from "@/mocks/admin";
import type { ApprovalTypeTab } from "@/pages/approvals/approvals.types";

/** Lọc theo loại yêu cầu. Danh sách loại dài nên dùng ô chọn thay cho hàng tab. */
export function ApprovalTypeTabs({
  value,
  onValueChange,
}: {
  value: ApprovalTypeTab;
  onValueChange: (value: ApprovalTypeTab) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as ApprovalTypeTab)}>
      <SelectTrigger className="w-60" aria-label="Lọc theo loại yêu cầu">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Mọi loại yêu cầu</SelectItem>
        {(Object.keys(approvalLabel) as ApprovalType[]).map((type) => (
          <SelectItem key={type} value={type}>
            {approvalLabel[type]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
