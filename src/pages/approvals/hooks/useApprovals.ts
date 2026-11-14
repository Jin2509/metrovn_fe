import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import { approvalsStore, type Approval } from "@/stores/admin";
import {
  applyApprovalDecision,
  sourceKey,
  useApprovalsData,
} from "@/pages/approvals/approvals.service";
import { useSelectedRequest } from "@/pages/approvals/hooks/useWorkRequests";
import type {
  ApprovalDecisionStatus,
  ApprovalStatusFilter,
  ApprovalTypeTab,
} from "@/pages/approvals/approvals.types";

export function useApprovals(initialStatus: ApprovalStatusFilter = "PENDING") {
  const queryClient = useQueryClient();
  const data = useApprovalsData();
  const list = approvalsStore.use();
  const [tab, setTab] = useState<ApprovalTypeTab>("ALL");
  const [status, setStatus] = useState<ApprovalStatusFilter>(initialStatus);
  // Đề xuất đang mở nằm trên URL (`?request=…`) để mở được từ yêu cầu gắn kèm ở tab khác.
  const { selectedId, select } = useSelectedRequest();
  const selected = list.find((approval) => approval.id === selectedId) ?? null;
  const setSelected = (approval: Approval | null) => select(approval?.id ?? null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const rows = list.filter(
    (approval) =>
      (tab === "ALL" || approval.type === tab) && (status === "ALL" || approval.status === status),
  );

  const decide = async (decision: ApprovalDecisionStatus, reason?: string) => {
    if (!selected || pending) return;
    setPending(true);
    try {
      await applyApprovalDecision(selected, decision, reason);
      toast.success(decision === "APPROVED" ? "Đã phê duyệt" : "Đã từ chối");
      setSelected(null);
      setRejectOpen(false);
      await queryClient.invalidateQueries({ queryKey: sourceKey(selected.type) });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return {
    ...data,
    rows,
    tab,
    setTab,
    status,
    setStatus,
    selected,
    setSelected,
    rejectOpen,
    setRejectOpen,
    pending,
    decide,
  };
}
