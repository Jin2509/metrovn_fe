import { afterEach, describe, expect, it } from "vitest";

import {
  applyLineOrderApproval,
  chainage,
  requestLineOrderChange,
  runningTimeMinutes,
  saveLineOrder,
  validateLineOrder,
  type LineApprovalPayload,
} from "@/lib/network";
import { approvalsStore } from "@/mocks/admin";
import { lineStationRows, lineStationsStore } from "@/mocks/metro";
import { fareForDistance, moveRow } from "@/pages/lines/lines.service";

const seedApprovals = [...approvalsStore.get()];
afterEach(() => approvalsStore.set(() => seedApprovals));

const brackets = [
  { from: 0, to: 5, price: 7000 },
  { from: 5, to: 10, price: 12000 },
  { from: 10, to: 15, price: 16000 },
  { from: 15, to: 20, price: 20000 },
];

describe("lý trình và giá vé", () => {
  it("Tuyến 1 dài khoảng 19,7 km và chạy một chiều khoảng 30–35 phút", () => {
    const rows = chainage(lineStationRows("L1"));
    expect(rows.at(-1)!.km).toBeGreaterThan(19);
    expect(rows.at(-1)!.km).toBeLessThan(20.5);
    expect(runningTimeMinutes("L1")).toBeGreaterThanOrEqual(30);
    expect(runningTimeMinutes("L1")).toBeLessThanOrEqual(36);
  });

  it("giá theo bậc cự ly, biên trên thuộc bậc dưới", () => {
    expect(fareForDistance(0.7, brackets).price).toBe(7000);
    expect(fareForDistance(5, brackets).price).toBe(7000);
    expect(fareForDistance(5.01, brackets).price).toBe(12000);
    expect(fareForDistance(25, brackets).price).toBe(20000);
  });
});

describe("sắp xếp thứ tự ga (UC4-01)", () => {
  it("báo lỗi khi trùng số thứ tự hoặc thiếu khoảng cách", () => {
    const rows = lineStationRows("L1");
    expect(validateLineOrder(rows)).toEqual([]);
    expect(validateLineOrder(rows.map((r, i) => (i === 3 ? { ...r, order: 2 } : r)))[0]).toMatch(
      /^Thứ tự ga không hợp lệ/,
    );
    expect(
      validateLineOrder(rows.map((r, i) => (i === 5 ? { ...r, distanceFromPrevKm: 0 } : r))),
    ).toHaveLength(1);
  });

  it("di chuyển ga đánh lại số thứ tự liên tục; lưu thì ga đầu không còn khoảng cách", () => {
    const before = lineStationsStore.get();
    const moved = moveRow(lineStationRows("L2"), 1, 0);
    expect(moved.map((r) => r.order)).toEqual(moved.map((_, i) => i + 1));
    const saved = saveLineOrder("L2", moved);
    expect(saved[0].distanceFromPrevKm).toBeNull();
    expect(lineStationRows("L1")).toEqual(before.filter((r) => r.lineId === "L1"));
    lineStationsStore.set(() => before);
  });
});

// Admin không được tự ý đổi thứ tự ga/lý trình: request* chỉ tạo yêu cầu phê duyệt (LINE); dữ
// liệu thật chỉ thay đổi khi Manager duyệt và `applyLineOrderApproval` được gọi.
describe("requestLineOrderChange", () => {
  it("chỉ tạo yêu cầu phê duyệt, không ghi vào kho line_station", () => {
    const before = lineStationsStore.get();
    const moved = moveRow(lineStationRows("L2"), 1, 0);
    const error = requestLineOrderChange("L2", moved);
    expect(error).toBeNull();
    expect(lineStationsStore.get()).toEqual(before);
    const approval = approvalsStore.get()[0];
    expect(approval).toMatchObject({ type: "LINE", status: "PENDING" });
    expect((approval.payload as LineApprovalPayload).lineId).toBe("L2");
  });

  it("chặn gửi yêu cầu thứ hai cho cùng một tuyến khi đang chờ duyệt", () => {
    const moved = moveRow(lineStationRows("L2"), 1, 0);
    expect(requestLineOrderChange("L2", moved)).toBeNull();
    expect(requestLineOrderChange("L2", moved)).toBe(
      "Tuyến này đang có một yêu cầu chờ Manager duyệt",
    );
  });

  it("applyLineOrderApproval mới thật sự ghi thứ tự ga mới vào kho", () => {
    const before = lineStationsStore.get();
    const moved = moveRow(lineStationRows("L2"), 1, 0);
    requestLineOrderChange("L2", moved);
    const payload = approvalsStore.get()[0].payload as LineApprovalPayload;
    applyLineOrderApproval(payload);
    expect(lineStationRows("L2").map((r) => r.stationId)).toEqual(moved.map((r) => r.stationId));
    lineStationsStore.set(() => before);
  });
});
