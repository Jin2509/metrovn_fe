import { approvalsStore, logAction, promosStore, type Approval } from "@/mocks/admin";
import { getActorName } from "@/lib/auth/session.store";
import {
  applyLineOrderApproval,
  applyStationApproval,
  type LineApprovalPayload,
  type StationApprovalPayload,
} from "@/lib/network";
import type { ApprovalDecisionStatus } from "@/pages/approvals/approvals.types";
import { applyOperationDecision } from "@/pages/trains/trains.service";

export function applyApprovalDecision(
  approval: Approval,
  status: ApprovalDecisionStatus,
  reason?: string,
) {
  approvalsStore.set((approvals) =>
    approvals.map((currentApproval) =>
      currentApproval.id === approval.id
        ? { ...currentApproval, status, reason, decidedBy: getActorName() }
        : currentApproval,
    ),
  );

  if (approval.type === "OPERATION") applyOperationDecision(status === "APPROVED", getActorName());

  // Ga và tuyến: Admin chỉ đề xuất (xem lib/network.ts); dữ liệu chỉ thực sự được ghi ở đây,
  // và chỉ khi Manager chọn "Phê duyệt". Từ chối thì không có gì thay đổi trong hệ thống.
  if (approval.type === "STATION" && status === "APPROVED")
    applyStationApproval(approval.payload as StationApprovalPayload);

  if (approval.type === "LINE" && status === "APPROVED")
    applyLineOrderApproval(approval.payload as LineApprovalPayload);

  if (approval.type === "PROMOTION")
    promosStore.set((promotions) =>
      promotions.map((promotion) =>
        // TODO(refactor): Match promotions by a stable identifier, preserving the current behavior for now.
        approval.title.endsWith(promotion.name) && promotion.status === "DRAFT"
          ? { ...promotion, status: status === "APPROVED" ? "ACTIVE" : "DRAFT" }
          : promotion,
      ),
    );

  logAction(status === "APPROVED" ? "Phê duyệt" : "Từ chối", approval.title);
}
