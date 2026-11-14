import { DataTable, Section, StatusBadge } from "@/components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserNames } from "@/hooks/use-user-names";
import { fmtInstant } from "@/lib/query-sync";
import { approvalLabel, type Approval } from "@/stores/admin";
import { APPROVAL_STATUS_OPTIONS } from "@/pages/approvals/approvals.constants";
import type { ApprovalStatusFilter } from "@/pages/approvals/approvals.types";

export function ApprovalListSection({
  title = "Đề xuất thay đổi",
  description,
  rows,
  status,
  onStatusChange,
  onSelect,
}: {
  title?: string;
  description?: string;
  rows: Approval[];
  status: ApprovalStatusFilter;
  onStatusChange: (status: ApprovalStatusFilter) => void;
  onSelect: (approval: Approval) => void;
}) {
  const nameOf = useUserNames();
  return (
    <Section
      title={title}
      description={description}
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
        rowKey={(approval) => approval.id}
        rowActionLabel={(approval) => `Xem đề xuất ${approval.title}`}
        onRow={onSelect}
        empty="Không có yêu cầu nào"
        cols={[
          { h: "Loại", c: (approval) => approvalLabel[approval.type] },
          { h: "Nội dung", c: (approval) => <b>{approval.title}</b> },
          { h: "Người gửi", c: (approval) => nameOf(approval.by) },
          { h: "Thời điểm", c: (approval) => fmtInstant(approval.at) },
          { h: "Trạng thái", c: (approval) => <StatusBadge s={approval.status} /> },
        ]}
      />
    </Section>
  );
}
