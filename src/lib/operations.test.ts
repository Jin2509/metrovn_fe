import { afterEach, describe, expect, it, vi } from "vitest";

import { operationConfigsApi, type OperationConfigResponse } from "@/lib/api";
import { availableTrains, checkOperationConfig, minTrainsNeeded } from "@/lib/operations";
import { toOperationConfig } from "@/lib/operations.queries";
import { trainsStore } from "@/stores/operations";
import { newDraftFrom, saveConfigDraft } from "@/pages/trains/trains.service";

afterEach(() => vi.restoreAllMocks());

const base = {
  lineId: "L1",
  numberOfTrains: 13,
  headwayMinutes: 6,
  runningTimeMinutes: 33,
  turnaroundTimeMinutes: 4,
  startTime: "05:00",
  endTime: "22:00",
  effectiveFrom: "2026-11-01",
};

describe("số đoàn tàu tối thiểu", () => {
  it("chu kỳ = 2 × chạy + 2 × quay đầu; số tàu = ⌈chu kỳ ÷ giãn cách⌉", () => {
    expect(minTrainsNeeded(base)).toEqual({ cycleMinutes: 74, trains: 13 });
    expect(minTrainsNeeded({ ...base, headwayMinutes: 5 }).trains).toBe(15);
  });

  it("số tàu khả dụng chỉ tính tàu đang chạy hoặc sẵn sàng", () => {
    const trains = trainsStore.get();
    expect(availableTrains("L1", trains)).toBe(
      trains.filter((t) => t.status === "IN_OPERATION" || t.status === "READY").length,
    );
  });
});

describe("checkOperationConfig", () => {
  it("cấu hình đủ tàu thì không lỗi", () => {
    expect(checkOperationConfig(base, 14)).toEqual({ errors: [], capacity: [], warnings: [] });
  });

  it("tách lỗi nhập liệu khỏi lỗi thiếu tàu", () => {
    const bad = checkOperationConfig({ ...base, startTime: "23:00", headwayMinutes: 0 }, 14);
    expect(bad.errors).toHaveLength(2);
    const few = checkOperationConfig({ ...base, numberOfTrains: 10 }, 14);
    expect(few.errors).toEqual([]);
    expect(few.capacity[0]).toMatch(/cần ít nhất 13 đoàn tàu/);
    const tooMany = checkOperationConfig({ ...base, headwayMinutes: 5, numberOfTrains: 15 }, 14);
    expect(tooMany.capacity[0]).toMatch(/chỉ có 14 đoàn/);
    expect(checkOperationConfig(base, 13).warnings).toHaveLength(1);
  });

  it("bản nháp mặc định lấy thời gian chạy từ bảng tuyến – ga", () => {
    expect(newDraftFrom(undefined, "L1").runningTimeMinutes).toBeGreaterThan(25);
  });
});

const apiConfig: OperationConfigResponse = {
  id: 7,
  lineId: 2,
  version: 3,
  numberOfTrains: 12,
  headwayMinutes: 6,
  runningTimeMinutes: 33,
  turnaroundTimeMinutes: null,
  startTime: "05:00:00",
  endTime: "22:30:00",
  effectiveFrom: "2026-12-01",
  effectiveTo: null,
  status: "PENDING_APPROVAL",
  createdBy: "u-1",
  submittedAt: "2026-11-10T02:00:00Z",
  approvedBy: null,
  approvedAt: null,
  rejectionReason: null,
  createdAt: "2026-11-09T02:00:00Z",
  updatedAt: "2026-11-10T02:00:00Z",
};

describe("cấu hình vận hành từ backend", () => {
  it("đổi giờ HH:mm:ss về HH:mm, mã số về chuỗi, thiếu thời gian quay đầu thì 0", () => {
    expect(toOperationConfig(apiConfig)).toMatchObject({
      id: "7",
      lineId: "2",
      startTime: "05:00",
      endTime: "22:30",
      turnaroundTimeMinutes: 0,
      effectiveTo: undefined,
      status: "PENDING_APPROVAL",
    });
  });

  it("lưu nháp mới gọi POST theo tuyến; sửa thì PUT, bỏ ngày kết thúc thì gửi clearEffectiveTo", async () => {
    const create = vi.spyOn(operationConfigsApi, "create").mockResolvedValue(apiConfig);
    const update = vi.spyOn(operationConfigsApi, "update").mockResolvedValue(apiConfig);
    const draft = { ...base, lineId: "2" };
    await saveConfigDraft(draft);
    expect(create).toHaveBeenCalledWith(2, expect.objectContaining({ numberOfTrains: 13 }));
    await saveConfigDraft(draft, "7");
    expect(update).toHaveBeenCalledWith(7, expect.objectContaining({ clearEffectiveTo: true }));
  });
});
