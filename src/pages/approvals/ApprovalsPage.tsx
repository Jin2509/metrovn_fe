import { FileCheck2, Inbox } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { PoliciesPanel } from "@/pages/policies";
import { ReasonDialog } from "@/components/shared";
import { ApprovalDetailSheet } from "@/pages/approvals/components/ApprovalDetailSheet";
import { ApprovalListSection } from "@/pages/approvals/components/ApprovalListSection";
import { ApprovalTypeTabs } from "@/pages/approvals/components/ApprovalTypeTabs";
import { useApprovals } from "@/pages/approvals/hooks/useApprovals";

function ApprovalInboxPanel() {
  const {
    rows,
    tab,
    setTab,
    status,
    setStatus,
    selected,
    setSelected,
    rejectOpen,
    setRejectOpen,
    decide,
  } = useApprovals();

  return (
    <>
      <ApprovalTypeTabs value={tab} onValueChange={setTab} />
      <ApprovalListSection
        rows={rows}
        status={status}
        onStatusChange={setStatus}
        onSelect={setSelected}
      />
      <ApprovalDetailSheet
        approval={selected}
        onClose={() => setSelected(null)}
        onApprove={() => decide("APPROVED")}
        onReject={() => setRejectOpen(true)}
      />
      <ReasonDialog
        open={rejectOpen}
        title="Từ chối yêu cầu"
        confirmLabel="Từ chối"
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => decide("REJECTED", reason)}
      />
    </>
  );
}

export function ApprovalsPage() {
  return (
    <AppShell title="Phê duyệt & chính sách">
      <PageTabs
        tabs={[
          { value: "inbox", label: "Hộp phê duyệt", icon: Inbox, content: <ApprovalInboxPanel /> },
          {
            value: "policies",
            label: "Chính sách đang áp dụng",
            icon: FileCheck2,
            content: <PoliciesPanel />,
          },
        ]}
      />
    </AppShell>
  );
}
