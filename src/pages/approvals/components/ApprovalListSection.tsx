import { DataTable, Section, StatusBadge } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { approvalLabel, type Approval } from "@/mocks/admin";
import { APPROVAL_STATUS_OPTIONS } from "@/pages/approvals/approvals.constants";
import type { ApprovalStatusFilter } from "@/pages/approvals/approvals.types";

export function ApprovalListSection({
  rows,
  status,
  onStatusChange,
  onSelect,
}: {
  rows: Approval[];
  status: ApprovalStatusFilter;
  onStatusChange: (status: ApprovalStatusFilter) => void;
  onSelect: (approval: Approval) => void;
}) {
  return (
    <Section
      title="Yêu cầu"
      action={
        <Select
          value={status}
          onValueChange={(nextStatus) => onStatusChange(nextStatus as ApprovalStatusFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPROVAL_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <DataTable
        rows={rows}
        onRow={onSelect}
        empty="Không có yêu cầu nào"
        cols={[
          { h: "Loại", c: (approval) => approvalLabel[approval.type] },
          { h: "Nội dung", c: (approval) => <b>{approval.title}</b> },
          { h: "Người gửi", c: (approval) => approval.by },
          { h: "Thời điểm", c: (approval) => approval.at },
          { h: "Trạng thái", c: (approval) => <StatusBadge s={approval.status} /> },
        ]}
      />
    </Section>
  );
}
