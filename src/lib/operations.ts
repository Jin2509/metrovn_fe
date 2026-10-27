import { logAction } from "@/mocks/admin";
import {
  trainsStore,
  type OperationConfig,
  type OperationConfigStatus,
  type Train,
  type TrainStatus,
} from "@/mocks/operations";

// Nghiệp vụ đoàn tàu và cấu hình vận hành — mọi phép tính chỉ dùng các cột có trong bảng
// `train` và `operation_config`.

export const TRAIN_STATUS_LABELS: Record<TrainStatus, string> = {
  READY: "Sẵn sàng",
  IN_OPERATION: "Đang chạy",
  MAINTENANCE: "Bảo dưỡng",
  OUT_OF_SERVICE: "Ngừng sử dụng",
};

export const CONFIG_STATUS_LABELS: Record<OperationConfigStatus, string> = {
  DRAFT: "Nháp",
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt, chờ hiệu lực",
  ACTIVE: "Đang áp dụng",
  INACTIVE: "Hết hiệu lực",
};

/** Tàu có thể đưa vào khai thác: đang chạy hoặc sẵn sàng, đã phân về tuyến. */
export const availableTrains = (lineId: string, trains: Train[] = trainsStore.get()) =>
  trains.filter((t) => t.lineId === lineId && (t.status === "READY" || t.status === "IN_OPERATION"))
    .length;

/**
 * Số đoàn tàu tối thiểu để giữ giãn cách:
 *   chu kỳ quay vòng = 2 × thời gian chạy một chiều + 2 × thời gian quay đầu
 *   số tàu tối thiểu = ⌈chu kỳ ÷ giãn cách⌉
 */
export function minTrainsNeeded(
  c: Pick<OperationConfig, "headwayMinutes" | "runningTimeMinutes" | "turnaroundTimeMinutes">,
) {
  const cycleMinutes = 2 * c.runningTimeMinutes + 2 * c.turnaroundTimeMinutes;
  return { cycleMinutes, trains: Math.ceil(cycleMinutes / c.headwayMinutes) };
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** errors: dữ liệu nhập sai (chặn lưu) · capacity: không đủ tàu (cho lưu nháp, chặn gửi duyệt). */
export type ConfigCheck = { errors: string[]; capacity: string[]; warnings: string[] };

export function checkOperationConfig(
  c: Omit<OperationConfig, "id" | "version" | "status" | "createdBy" | "approvedBy">,
  available: number,
): ConfigCheck {
  const errors: string[] = [];
  const capacity: string[] = [];
  const warnings: string[] = [];
  if (!(c.headwayMinutes > 0)) errors.push("Giãn cách phải lớn hơn 0");
  if (!(c.runningTimeMinutes > 0)) errors.push("Thời gian chạy phải lớn hơn 0");
  if (!(c.turnaroundTimeMinutes >= 0)) errors.push("Thời gian quay đầu không được âm");
  if (!(c.numberOfTrains > 0)) errors.push("Số đoàn tàu phải lớn hơn 0");
  if (
    !/^\d{2}:\d{2}$/.test(c.startTime) ||
    !/^\d{2}:\d{2}$/.test(c.endTime) ||
    toMin(c.startTime) >= toMin(c.endTime)
  )
    errors.push("Giờ bắt đầu phải trước giờ kết thúc");
  if (!c.effectiveFrom) errors.push("Chọn ngày bắt đầu hiệu lực");
  if (c.effectiveTo && c.effectiveTo <= c.effectiveFrom)
    errors.push("Ngày kết thúc hiệu lực phải sau ngày bắt đầu");
  if (errors.length) return { errors, capacity, warnings };

  const need = minTrainsNeeded(c);
  if (c.numberOfTrains < need.trains)
    capacity.push(
      `Với chu kỳ ${need.cycleMinutes} phút và giãn cách ${c.headwayMinutes} phút cần ít nhất ${need.trains} đoàn tàu, cấu hình chỉ khai báo ${c.numberOfTrains}`,
    );
  if (c.numberOfTrains > available)
    capacity.push(
      `Khai báo ${c.numberOfTrains} đoàn tàu nhưng tuyến chỉ có ${available} đoàn đang chạy hoặc sẵn sàng`,
    );
  else if (c.numberOfTrains === available)
    warnings.push("Dùng hết số tàu sẵn có, không còn tàu dự phòng khi có sự cố");
  return { errors, capacity, warnings };
}

export function setTrainStatus(train: Train, status: TrainStatus) {
  trainsStore.set((list) => list.map((t) => (t.id === train.id ? { ...t, status } : t)));
  logAction("Cập nhật trạng thái tàu", `${train.code}: ${TRAIN_STATUS_LABELS[status]}`);
}
