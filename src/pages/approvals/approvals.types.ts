import type { Approval, ApprovalType } from "@/mocks/admin";

export type ApprovalTypeTab = "ALL" | ApprovalType;
export type ApprovalStatusFilter = "ALL" | Approval["status"];
export type ApprovalDecisionStatus = Exclude<Approval["status"], "PENDING">;
