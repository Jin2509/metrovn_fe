import { toast } from "sonner";
import { operationConfigsStore, trains } from "@/mocks/admin";
import { submitOperationConfigForApproval } from "@/pages/trains/trains.service";

export function useTrains() {
  const configs = operationConfigsStore.use();

  const sendConfig = (configId: string) => {
    submitOperationConfigForApproval(configs, configId);
    toast.success("Đã gửi Manager duyệt");
  };

  return { trains, configs, sendConfig };
}
