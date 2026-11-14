import { createStore } from "@/lib/store";

// Đoàn tàu và cấu hình vận hành phía client — trường bám theo bảng `train` và `operation_config`
// trong báo cáo (mục 3.3.2.12, 3.3.2.13). Dữ liệu thật: `trainsApi`, `operationConfigsApi`.

/** READY: sẵn sàng · IN_OPERATION: đang chạy · MAINTENANCE: bảo dưỡng · OUT_OF_SERVICE: ngừng sử dụng. */
export type TrainStatus = "READY" | "IN_OPERATION" | "MAINTENANCE" | "OUT_OF_SERVICE";

export type Train = {
  id: string;
  code: string;
  name: string;
  lineId: string;
  capacity: number;
  manufactureYear: number;
  status: TrainStatus;
};

export const trainsStore = createStore<Train[]>([]);

/**
 * DRAFT → PENDING_APPROVAL (gửi Manager) → APPROVED | REJECTED; APPROVED → kích hoạt → ACTIVE ⇄ INACTIVE.
 * REJECTED sửa lại được rồi gửi duyệt lại.
 */
export type OperationConfigStatus =
  "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";

export type OperationConfig = {
  id: string;
  version: number;
  lineId: string;
  numberOfTrains: number;
  headwayMinutes: number;
  /** Thời gian chạy một chiều từ ga đầu đến ga cuối, gồm thời gian dừng ở các ga (phút). */
  runningTimeMinutes: number;
  turnaroundTimeMinutes: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: OperationConfigStatus;
  createdBy: string;
  approvedBy?: string;
  submittedAt?: string;
  rejectionReason?: string;
};

export const operationConfigsStore = createStore<OperationConfig[]>([]);
