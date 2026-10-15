import { operationConfigsStore, trains } from "@/mocks/admin";

export type Train = (typeof trains)[number];
export type OperationConfig = ReturnType<typeof operationConfigsStore.use>[number];
