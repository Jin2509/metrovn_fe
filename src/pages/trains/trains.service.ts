import { operationConfigsStore, submitApproval } from "@/mocks/admin";
import type { OperationConfig } from "@/pages/trains/trains.types";

export function submitOperationConfigForApproval(configs: OperationConfig[], configId: string) {
  const config = configs.find((item) => item.id === configId)!;
  const currentConfig = configs.find((item) => item.status === "ACTIVE");
  operationConfigsStore.set((currentConfigs) =>
    currentConfigs.map((item) => (item.id === configId ? { ...item, status: "PENDING" } : item)),
  );
  submitApproval("OPERATION", `Cấu hình vận hành ${config.version}`, [
    { field: "Giãn cách", old: currentConfig?.headway ?? "—", new: config.headway },
    { field: "Giờ vận hành", old: currentConfig?.hours ?? "—", new: config.hours },
  ]);
}
