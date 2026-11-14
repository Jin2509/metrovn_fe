import {
  operationConfigsApi,
  trainsApi,
  type OperationConfigResponse,
  type TrainResponse,
} from "@/lib/api";
import { useSyncedQuery } from "@/lib/query-sync";
import {
  operationConfigsStore,
  trainsStore,
  type OperationConfig,
  type Train,
} from "@/stores/operations";

export const OPERATIONS_KEY = ["operations"] as const;
export const operationsKeys = {
  trains: [...OPERATIONS_KEY, "trains"] as const,
  configs: [...OPERATIONS_KEY, "configs"] as const,
};

export const toTrain = (t: TrainResponse): Train => ({
  id: String(t.id),
  code: t.code,
  name: t.nameTrain ?? "",
  lineId: t.lineId == null ? "" : String(t.lineId),
  capacity: t.capacity ?? 0,
  manufactureYear: t.manufactureYear ?? 0,
  status: t.status,
});

/** Backend trả giờ dạng HH:mm:ss; form và phép tính dùng HH:mm. */
const hhmm = (t: string) => t.slice(0, 5);

export const toOperationConfig = (c: OperationConfigResponse): OperationConfig => ({
  id: String(c.id),
  version: c.version,
  lineId: String(c.lineId),
  numberOfTrains: c.numberOfTrains,
  headwayMinutes: c.headwayMinutes,
  runningTimeMinutes: c.runningTimeMinutes,
  turnaroundTimeMinutes: c.turnaroundTimeMinutes ?? 0,
  startTime: hhmm(c.startTime),
  endTime: hhmm(c.endTime),
  effectiveFrom: c.effectiveFrom,
  effectiveTo: c.effectiveTo ?? undefined,
  status: c.status,
  createdBy: c.createdBy ?? "",
  approvedBy: c.approvedBy ?? undefined,
  submittedAt: c.submittedAt ?? undefined,
  rejectionReason: c.rejectionReason ?? undefined,
});

/** Toàn bộ đoàn tàu, đồng bộ vào `trainsStore`. */
export function useTrainsData() {
  return useSyncedQuery({
    queryKey: operationsKeys.trains,
    queryFn: trainsApi.all,
    store: trainsStore,
    map: (list: TrainResponse[]) => list.map(toTrain),
  });
}

/** Cấu hình vận hành của mọi tuyến, đồng bộ vào `operationConfigsStore`. */
export function useOperationConfigsData() {
  return useSyncedQuery({
    queryKey: operationsKeys.configs,
    queryFn: () => operationConfigsApi.list(),
    store: operationConfigsStore,
    map: (list: OperationConfigResponse[]) => list.map(toOperationConfig),
  });
}
