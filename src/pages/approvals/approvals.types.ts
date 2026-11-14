import type { Approval, ApprovalType } from "@/stores/admin";

export type ApprovalTypeTab = "ALL" | ApprovalType;
export type ApprovalStatusFilter = "ALL" | Approval["status"];
export type ApprovalDecisionStatus = Exclude<Approval["status"], "PENDING">;
