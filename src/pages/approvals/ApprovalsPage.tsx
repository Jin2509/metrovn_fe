import { AppShell } from "@/components/app-shell";
import { ReasonDialog } from "@/components/shared";
import { ApprovalDetailSheet } from "@/pages/approvals/components/ApprovalDetailSheet";
import { ApprovalListSection } from "@/pages/approvals/components/ApprovalListSection";
import { ApprovalTypeTabs } from "@/pages/approvals/components/ApprovalTypeTabs";
import { useApprovals } from "@/pages/approvals/hooks/useApprovals";

export function ApprovalsPage() {
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
    <AppShell title="Hộp phê duyệt" roles={["MANAGER"]}>
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
    </AppShell>
  );
}
