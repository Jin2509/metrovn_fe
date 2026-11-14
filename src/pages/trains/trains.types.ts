import type { OperationConfig, Train } from "@/stores/operations";

export type { OperationConfig, Train };

export type ConfigDraft = Omit<
  OperationConfig,
  "id" | "version" | "status" | "createdBy" | "approvedBy" | "submittedAt" | "rejectionReason"
>;
