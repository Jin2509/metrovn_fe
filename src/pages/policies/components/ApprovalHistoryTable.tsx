import { DataTable, Section, StatusBadge } from "@/components/shared";
import { useUserNames } from "@/hooks/use-user-names";
import { fmtInstant } from "@/lib/query-sync";
import { approvalLabel, type Approval } from "@/stores/admin";

export function ApprovalHistoryTable({ approvals }: { approvals: Approval[] }) {
  const nameOf = useUserNames();
  return (
    <Section title="Lịch sử phê duyệt">
      <DataTable
        rows={approvals}
        rowKey={(a) => a.id}
        cols={[
          { h: "Loại", c: (approval) => approvalLabel[approval.type] },
          { h: "Nội dung", c: (approval) => approval.title },
          { h: "Gửi lúc", c: (approval) => fmtInstant(approval.at) },
          {
            h: "Người duyệt",
            c: (approval) => (approval.decidedBy ? nameOf(approval.decidedBy) : "—"),
          },
          {
            h: "Kết quả",
            c: (approval) => (
              <div>
                <StatusBadge s={approval.status} />
                {approval.reason && (
                  <p className="mt-1 max-w-56 text-xs text-destructive">{approval.reason}</p>
                )}
              </div>
            ),
          },
        ]}
      />
    </Section>
  );
}
