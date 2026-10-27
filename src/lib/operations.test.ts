import { afterEach, describe, expect, it } from "vitest";

import { availableTrains, checkOperationConfig, minTrainsNeeded } from "@/lib/operations";
import { operationConfigsStore, trainsStore } from "@/mocks/operations";
import { applyOperationDecision, newDraftFrom } from "@/pages/trains/trains.service";

const configs = operationConfigsStore.get();
afterEach(() => operationConfigsStore.set(() => configs));

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
    expect(newDraftFrom(undefined).runningTimeMinutes).toBeGreaterThan(25);
  });
});

describe("Manager duyệt cấu hình vận hành", () => {
  it("duyệt cấu hình có ngày hiệu lực trong tương lai thì chuyển APPROVED, cấu hình cũ giữ ACTIVE", () => {
    operationConfigsStore.set((l) =>
      l.map((c) => (c.id === "C4" ? { ...c, status: "PENDING_APPROVAL" } : c)),
    );
    applyOperationDecision(true, "Trần Thị Bình");
    const list = operationConfigsStore.get();
    expect(list.find((c) => c.id === "C4")).toMatchObject({
      status: "APPROVED",
      approvedBy: "Trần Thị Bình",
    });
    expect(list.find((c) => c.id === "C3")?.status).toBe("ACTIVE");
  });

  it("duyệt cấu hình đã đến ngày thì áp dụng ngay và đóng cấu hình cũ", () => {
    operationConfigsStore.set((l) =>
      l.map((c) =>
        c.id === "C4" ? { ...c, status: "PENDING_APPROVAL", effectiveFrom: "2020-01-01" } : c,
      ),
    );
    applyOperationDecision(true, "Trần Thị Bình");
    const list = operationConfigsStore.get();
    expect(list.find((c) => c.id === "C4")?.status).toBe("ACTIVE");
    expect(list.find((c) => c.id === "C3")?.status).toBe("INACTIVE");
  });

  it("từ chối thì trả về nháp", () => {
    operationConfigsStore.set((l) =>
      l.map((c) => (c.id === "C4" ? { ...c, status: "PENDING_APPROVAL" } : c)),
    );
    applyOperationDecision(false, "Trần Thị Bình");
    expect(operationConfigsStore.get().find((c) => c.id === "C4")?.status).toBe("DRAFT");
  });
});
