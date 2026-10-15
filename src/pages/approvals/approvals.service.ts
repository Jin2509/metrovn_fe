import {
  approvalsStore,
  currentUser,
  logAction,
  operationConfigsStore,
  promosStore,
  type Approval,
} from "@/mocks/admin";
import type { ApprovalDecisionStatus } from "@/pages/approvals/approvals.types";

export function applyApprovalDecision(
  approval: Approval,
  status: ApprovalDecisionStatus,
  reason?: string,
) {
  approvalsStore.set((approvals) =>
    approvals.map((currentApproval) =>
      currentApproval.id === approval.id
        ? { ...currentApproval, status, reason, decidedBy: currentUser("MANAGER") }
        : currentApproval,
    ),
  );

  if (approval.type === "OPERATION")
    operationConfigsStore.set((configs) =>
      configs.map((config) =>
        config.status === "PENDING"
          ? {
              ...config,
              status: status === "APPROVED" ? "ACTIVE" : "DRAFT",
              approvedBy: status === "APPROVED" ? currentUser("MANAGER") : "",
            }
          : status === "APPROVED" && config.status === "ACTIVE"
            ? { ...config, status: "INACTIVE" }
            : config,
      ),
    );

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
