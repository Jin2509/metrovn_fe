import { useState } from "react";
import { toast } from "sonner";
import { approvalsStore, type Approval } from "@/mocks/admin";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";
import { useSelectedRequest } from "@/pages/approvals/hooks/useWorkRequests";
import type {
  ApprovalDecisionStatus,
  ApprovalStatusFilter,
  ApprovalTypeTab,
} from "@/pages/approvals/approvals.types";

export function useApprovals(initialStatus: ApprovalStatusFilter = "PENDING") {
  const list = approvalsStore.use();
  const [tab, setTab] = useState<ApprovalTypeTab>("ALL");
  const [status, setStatus] = useState<ApprovalStatusFilter>(initialStatus);
  // Đề xuất đang mở nằm trên URL (`?request=A…`) để mở được từ yêu cầu gắn kèm ở tab khác.
  const { selectedId, select } = useSelectedRequest();
  const selected = list.find((approval) => approval.id === selectedId) ?? null;
  const setSelected = (approval: Approval | null) => select(approval?.id ?? null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const rows = list.filter(
    (approval) =>
      (tab === "ALL" || approval.type === tab) && (status === "ALL" || approval.status === status),
  );

  const decide = (decisionStatus: ApprovalDecisionStatus, reason?: string) => {
    if (!selected) return;
    const error = applyApprovalDecision(selected, decisionStatus, reason);
    if (error) return toast.error(error);
    toast.success(decisionStatus === "APPROVED" ? "Đã phê duyệt" : "Đã từ chối");
    setSelected(null);
    setRejectOpen(false);
  };

  return {
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
  };
}
