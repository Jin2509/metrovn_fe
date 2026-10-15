import { useState } from "react";
import { toast } from "sonner";
import { approvalsStore, type Approval } from "@/mocks/admin";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";
import type {
  ApprovalDecisionStatus,
  ApprovalStatusFilter,
  ApprovalTypeTab,
} from "@/pages/approvals/approvals.types";

export function useApprovals() {
  const list = approvalsStore.use();
  const [tab, setTab] = useState<ApprovalTypeTab>("ALL");
  const [status, setStatus] = useState<ApprovalStatusFilter>("PENDING");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const rows = list.filter(
    (approval) =>
      (tab === "ALL" || approval.type === tab) && (status === "ALL" || approval.status === status),
  );

  const decide = (decisionStatus: ApprovalDecisionStatus, reason?: string) => {
    if (!selected) return;
    applyApprovalDecision(selected, decisionStatus, reason);
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
