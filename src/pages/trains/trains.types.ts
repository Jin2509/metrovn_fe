import type { OperationConfig, Train } from "@/mocks/operations";

export type { OperationConfig, Train };

export type ConfigDraft = Omit<
  OperationConfig,
  "id" | "version" | "status" | "createdBy" | "approvedBy"
>;
