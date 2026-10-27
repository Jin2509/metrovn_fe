import { afterEach, describe, expect, it } from "vitest";

import {
  applyStationApproval,
  requestStationDelete,
  requestStationUpsert,
  saveStation,
  validateStation,
  type StationApprovalPayload,
  type StationDraft,
} from "@/lib/network";
import { approvalsStore, auditStore } from "@/mocks/admin";
import { replaceStations, stations, stationsStore } from "@/mocks/metro";

const seed = [...stationsStore.get()];
const seedApprovals = [...approvalsStore.get()];
afterEach(() => {
  replaceStations(seed);
  approvalsStore.set(() => seedApprovals);
});

const draft = (patch: Partial<StationDraft> = {}): StationDraft => ({
  code: "L3-01",
  name: "Ga thử",
  address: "",
  district: "Quận 7",
  lat: 10.73,
  lng: 106.72,
  interchange: false,
  status: "INACTIVE",
  ...patch,
});

describe("validateStation", () => {
  it("hợp lệ khi mã/tên chưa tồn tại và tọa độ trong khoảng", () => {
    expect(validateStation(draft(), seed)).toEqual({});
  });

  it("bắt trùng mã, trùng tên, thiếu tên và tọa độ sai", () => {
    const e = validateStation(draft({ code: "L1-01", lat: 95, lng: -200 }), seed);
    expect(e).toMatchObject({
      code: "Mã ga đã tồn tại",
      lat: expect.any(String),
      lng: expect.any(String),
    });
    expect(validateStation(draft({ name: "Bến Thành" }), seed).name).toBe("Tên ga đã tồn tại");
    expect(validateStation(draft({ name: " " }), seed).name).toBe("Thông tin đang bị thiếu");
    // Sửa chính ga đó thì không tính là trùng.
    const bt = seed.find((s) => s.code === "L1-01")!;
    expect(validateStation(draft({ code: "L1-01", name: "Bến Thành" }), seed, bt.id)).toEqual({});
  });
});

describe("saveStation", () => {
  it("thêm ga mới vào kho và mảng dùng chung, ghi nhật ký", () => {
    const before = auditStore.get().length;
    const s = saveStation(draft());
    expect(stationsStore.get().some((x) => x.id === s.id)).toBe(true);
    expect(stations.some((x) => x.id === s.id)).toBe(true);
    expect(auditStore.get().length).toBe(before + 1);
  });

  it("sửa ga giữ nguyên tuyến và lượt vào", () => {
    const bt = seed[0];
    const s = saveStation(draft({ code: bt.code, name: bt.name, status: "MAINTENANCE" }), bt.id);
    expect(s).toMatchObject({
      id: bt.id,
      status: "MAINTENANCE",
      lineIds: bt.lineIds,
      dailyFlow: bt.dailyFlow,
    });
  });
});

// Admin không được tự ý đổi dữ liệu ga: request* chỉ tạo yêu cầu phê duyệt (STATION), dữ liệu
// thật chỉ thay đổi khi apply* được gọi với quyết định "APPROVED" của Manager (đúng luồng
// `applyApprovalDecision` ở approvals.service.ts).
describe("requestStationUpsert", () => {
  it("tạo ga mới chỉ sinh yêu cầu phê duyệt, không ghi vào kho ga", () => {
    const before = stationsStore.get().length;
    const error = requestStationUpsert(draft());
    expect(error).toBeNull();
    expect(stationsStore.get().length).toBe(before);
    const approval = approvalsStore.get()[0];
    expect(approval).toMatchObject({ type: "STATION", status: "PENDING" });
    expect((approval.payload as StationApprovalPayload).action).toBe("CREATE");
  });

  it("sửa ga không có thay đổi gì thì báo lỗi, không tạo yêu cầu", () => {
    const bt = seed[0];
    const before = approvalsStore.get().length;
    const { id: _id, lineIds: _lineIds, order: _order, dailyFlow: _dailyFlow, ...unchanged } = bt;
    const error = requestStationUpsert(unchanged, bt.id);
    expect(error).toBe("Chưa có thay đổi nào");
    expect(approvalsStore.get().length).toBe(before);
  });

  it("chặn gửi yêu cầu thứ hai khi ga đang có yêu cầu chờ duyệt", () => {
    const bt = seed[0];
    expect(requestStationUpsert(draft({ code: bt.code, name: bt.name }), bt.id)).toBeNull();
    const error = requestStationUpsert(draft({ code: bt.code, name: bt.name }), bt.id);
    expect(error).toBe("Ga này đang có một yêu cầu chờ Manager duyệt");
  });

  it("applyStationApproval(CREATE/UPDATE) mới thật sự ghi vào kho ga", () => {
    requestStationUpsert(draft());
    const payload = approvalsStore.get()[0].payload as StationApprovalPayload;
    const before = stationsStore.get().length;
    applyStationApproval(payload);
    expect(stationsStore.get().length).toBe(before + 1);
  });
});

describe("requestStationDelete", () => {
  it("chặn xóa ga đang thuộc một tuyến", () => {
    const bt = seed[0]; // ga đầu Tuyến 1, lineIds không rỗng
    const error = requestStationDelete(bt, "Không còn sử dụng");
    expect(error).toMatch(/đang thuộc tuyến/);
    expect(approvalsStore.get().length).toBe(seedApprovals.length);
  });

  it("ga không thuộc tuyến nào: tạo yêu cầu xóa kèm lý do, chưa xóa khỏi kho", () => {
    const standalone = { ...seed[0], id: "S-test-standalone", lineIds: [] };
    const error = requestStationDelete(standalone, "Ga quy hoạch không còn khả thi");
    expect(error).toBeNull();
    const approval = approvalsStore.get()[0];
    expect(approval).toMatchObject({ type: "STATION", status: "PENDING" });
    expect(approval.changes.find((c) => c.field === "Lý do")?.new).toBe(
      "Ga quy hoạch không còn khả thi",
    );
    expect(stationsStore.get().some((s) => s.id === standalone.id)).toBe(false);
  });

  it("applyStationApproval(DELETE) xóa ga khỏi kho, nhưng giữ lại nếu ga vẫn đang gắn tuyến", () => {
    const standalone = saveStation(draft());
    requestStationDelete(standalone, "Dọn dữ liệu kiểm thử");
    const payload = approvalsStore.get()[0].payload as StationApprovalPayload;
    applyStationApproval(payload);
    expect(stationsStore.get().some((s) => s.id === standalone.id)).toBe(false);

    const bt = seed[0];
    applyStationApproval({ action: "DELETE", id: bt.id });
    expect(stationsStore.get().some((s) => s.id === bt.id)).toBe(true);
  });
});
