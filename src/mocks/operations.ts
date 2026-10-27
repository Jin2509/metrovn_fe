import { createStore } from "@/lib/store";

// Đoàn tàu và cấu hình vận hành (GIẢ LẬP) — trường bám theo bảng `train` và `operation_config`
// trong báo cáo (mục 3.3.2.12, 3.3.2.13).

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

const pad = (n: number) => String(n).padStart(2, "0");

export const trainsStore = createStore<Train[]>(
  Array.from({ length: 17 }, (_, i) => ({
    id: `T${pad(i + 1)}`,
    code: `HM-${pad(i + 1)}`,
    name: `Đoàn tàu số ${i + 1}`,
    lineId: "L1",
    capacity: 930,
    manufactureYear: i < 9 ? 2019 : 2020,
    status:
      i === 5 || i === 12
        ? "MAINTENANCE"
        : i === 16
          ? "OUT_OF_SERVICE"
          : i < 15
            ? "IN_OPERATION"
            : "READY",
  })),
);

/** DRAFT → PENDING_APPROVAL (gửi Manager) → APPROVED (chờ tới ngày hiệu lực) → ACTIVE → INACTIVE. */
export type OperationConfigStatus =
  "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "ACTIVE" | "INACTIVE";

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
};

export const operationConfigsStore = createStore<OperationConfig[]>([
  {
    id: "C2",
    version: 2,
    lineId: "L1",
    numberOfTrains: 11,
    headwayMinutes: 8,
    runningTimeMinutes: 33,
    turnaroundTimeMinutes: 4,
    startTime: "05:00",
    endTime: "22:00",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-06-30",
    status: "INACTIVE",
    createdBy: "Nguyễn Văn An",
    approvedBy: "Trần Thị Bình",
  },
  {
    id: "C3",
    version: 3,
    lineId: "L1",
    numberOfTrains: 13,
    headwayMinutes: 6,
    runningTimeMinutes: 33,
    turnaroundTimeMinutes: 4,
    startTime: "05:00",
    endTime: "22:00",
    effectiveFrom: "2026-07-01",
    status: "ACTIVE",
    createdBy: "Nguyễn Văn An",
    approvedBy: "Trần Thị Bình",
  },
  {
    id: "C4",
    version: 4,
    lineId: "L1",
    numberOfTrains: 15,
    headwayMinutes: 5,
    runningTimeMinutes: 33,
    turnaroundTimeMinutes: 4,
    startTime: "05:00",
    endTime: "22:30",
    effectiveFrom: "2026-11-15",
    status: "DRAFT",
    createdBy: "Nguyễn Văn An",
  },
]);
