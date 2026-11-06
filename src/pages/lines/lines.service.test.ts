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
import { lineStationRows, lineStationsStore, stations } from "@/mocks/metro";
import {
  buildLine3DModel,
  buildUpdateLineBody,
  lineTotals,
  moveRow,
  recalculatedStationIds,
  toLineDraft,
  travelSecondsBetween,
  validateLineDraft,
  visibleLabelIds,
} from "@/pages/lines/lines.service";

const seedApprovals = [...approvalsStore.get()];
afterEach(() => approvalsStore.set(() => seedApprovals));

describe("lý trình", () => {
  it("Tuyến 1 dài khoảng 19,7 km và chạy một chiều khoảng 30–35 phút", () => {
    const rows = chainage(lineStationRows("L1"));
    expect(rows.at(-1)!.km).toBeGreaterThan(19);
    expect(rows.at(-1)!.km).toBeLessThan(20.5);
    expect(runningTimeMinutes("L1")).toBeGreaterThanOrEqual(30);
    expect(runningTimeMinutes("L1")).toBeLessThanOrEqual(36);
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

describe("visibleLabelIds", () => {
  const label = (id: string, x: number, y: number, priority = false) => ({
    id,
    text: "Nhãn ga mẫu",
    x,
    y,
    priority,
  });

  it("ẩn nhãn đè lên nhau, giữ nhãn ở xa", () => {
    const ids = visibleLabelIds([label("A", 0, 0), label("B", 10, 2), label("C", 0, 100)]);
    expect([...ids]).toEqual(["A", "C"]);
  });

  it("nhãn ưu tiên thắng khi đè nhau, kể cả đứng sau trong danh sách", () => {
    const ids = visibleLabelIds([label("A", 0, 0), label("B", 10, 2, true)]);
    expect([...ids]).toEqual(["B"]);
  });
});

describe("buildLine3DModel", () => {
  const rowsOf = (lineId: string) => chainage(lineStationRows(lineId));

  it("Tuyến 1: lý trình tăng dần, kết cấu ngầm → chuyển tiếp → trên cao, có depot", () => {
    const rows = rowsOf("L1");
    const model = buildLine3DModel(rows, stations, "L1");
    expect(model.nodes).toHaveLength(14);
    expect(model.segments).toHaveLength(13);
    expect(model.nodes[0]).toMatchObject({
      name: "Bến Thành",
      structure: "UNDERGROUND",
      chainageKm: 0,
    });
    expect(model.nodes.at(-1)).toMatchObject({ name: "Suối Tiên", structure: "ELEVATED" });
    expect(model.segments[2].structure).toBe("TRANSITION");
    expect(model.depot?.kind).toBe("DEPOT");
    for (let i = 1; i < model.nodes.length; i++) {
      expect(model.nodes[i].chainageKm).toBeGreaterThan(model.nodes[i - 1].chainageKm);
    }
    // Khớp với số liệu ở "Tổng hợp tuyến", vì cùng lấy lý trình từ line_station.
    expect(model.totalKm).toBe(rows.at(-1)!.km);
    const sum = Object.values(model.lengthByStructure).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(model.totalKm, 6);
  });

  it("dựng theo thứ tự đang chỉnh và bỏ qua mã ga không tồn tại", () => {
    const rows = [...rowsOf("L1")].reverse();
    const model = buildLine3DModel([...rows, { stationId: "NOPE", km: 99 }], stations, "L1");
    expect(model.nodes[0].name).toBe("Suối Tiên");
    expect(model.nodes).toHaveLength(14);
  });
});

// ---------- API tuyến/ga ----------

const st = (id: number) => ({
  id,
  code: `ST${id}`,
  nameStation: `Ga ${id}`,
  latitude: 10,
  longitude: 106,
  address: null,
  district: null,
  imageUrl: null,
  isInterchange: false,
  status: "ACTIVE" as const,
  createdAt: "",
  updatedAt: "",
});
const row = (id: number, order: number, km: number, sec: number, dwell = 30) => ({
  id: id * 100,
  lineId: 1,
  lineCode: "BTS-01",
  lineName: "Tuyến 1",
  station: st(id),
  stationOrder: order,
  distanceFromPrevKm: km,
  travelTimeFromPrevSeconds: sec,
  dwellTimeSeconds: dwell,
  createdAt: "",
});

describe("recalculatedStationIds", () => {
  const before = [row(1, 1, 0, 0), row(2, 2, 1, 60), row(3, 3, 2, 120)];

  it("chèn ga vào giữa: đánh dấu ga mới và ga ngay sau vị trí chèn", () => {
    const after = [row(1, 1, 0, 0), row(4, 2, 0.5, 30), row(2, 3, 0.6, 36), row(3, 4, 2, 120)];
    expect(recalculatedStationIds(before, after)).toEqual([4, 2]);
  });

  it("gỡ ga: đánh dấu ga ngay sau ga bị gỡ", () => {
    const after = [row(1, 1, 0, 0), row(3, 2, 2.8, 170)];
    expect(recalculatedStationIds(before, after)).toEqual([3]);
  });

  it("không đổi gì thì không đánh dấu", () => {
    expect(recalculatedStationIds(before, before)).toEqual([]);
  });
});

describe("lineTotals / travelSecondsBetween", () => {
  const rows = [row(1, 1, 0, 0, 30), row(2, 2, 1, 60, 20), row(3, 3, 2, 120, 40)];

  it("tổng quãng đường và thời gian = Σ chạy + Σ dừng ở ga giữa", () => {
    const totals = lineTotals(rows);
    expect(totals.km).toBe(3);
    expect(totals.sec).toBe(60 + 120 + 20);
    expect(travelSecondsBetween(rows, 0, 2)).toBe(200);
    expect(travelSecondsBetween(rows, 1, 2)).toBe(120);
  });
});

describe("tuyến: form", () => {
  const line = {
    id: 1,
    code: "BTS-01",
    nameLine: "Bến Thành - Suối Tiên",
    colorHex: "#00AEEF",
    description: null,
    status: "ACTIVE" as const,
    createdAt: "",
    updatedAt: "",
  };

  it("chỉ gửi field đã đổi; xoá trắng màu gửi chuỗi rỗng", () => {
    expect(buildUpdateLineBody(toLineDraft(line), line)).toEqual({});
    expect(
      buildUpdateLineBody({ ...toLineDraft(line), colorHex: "", status: "INACTIVE" }, line),
    ).toEqual({
      colorHex: "",
      status: "INACTIVE",
    });
  });

  it("kiểm tra mã trùng, màu #RRGGBB", () => {
    expect(validateLineDraft({ ...toLineDraft(line), colorHex: "red" }, [line], 1)).toEqual({
      colorHex: "Màu phải có dạng #RRGGBB",
    });
    expect(validateLineDraft({ ...toLineDraft(line) }, [line]).code).toBe("Mã tuyến đã tồn tại");
  });
});
