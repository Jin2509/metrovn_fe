import { DataTable, Section, StatusBadge } from "@/components/shared";
import { approvalLabel, type Approval } from "@/mocks/admin";

export function ApprovalHistoryTable({ approvals }: { approvals: Approval[] }) {
  return (
    <Section title="Lịch sử phê duyệt">
      <DataTable
        rows={approvals}
        cols={[
          { h: "Loại", c: (approval) => approvalLabel[approval.type] },
          { h: "Nội dung", c: (approval) => approval.title },
          { h: "Người quyết định", c: (approval) => approval.decidedBy },
          { h: "Kết quả", c: (approval) => <StatusBadge s={approval.status} /> },
        ]}
      />
    </Section>
  );
}
