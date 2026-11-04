import { afterEach, describe, expect, it } from "vitest";
import {
  assignmentCatalog,
  parkingLotCatalog,
  parkingPriceCatalog,
  ticketTypeCatalog,
  trainCatalog,
} from "@/lib/catalogs";
import {
  pendingRequests,
  requestCreate,
  requestDelete,
  requestUpdate,
} from "@/lib/change-requests";
import {
  approvalsStore,
  parkingLotsStore,
  parkingPricesStore,
  ticketTypesStore,
  usersStore,
} from "@/mocks/admin";
import { trainsStore } from "@/mocks/operations";
import { applyApprovalDecision } from "@/pages/approvals/approvals.service";

const snapshot = () => ({
  approvals: approvalsStore.get(),
  tickets: ticketTypesStore.get(),
  lots: parkingLotsStore.get(),
  parking: parkingPricesStore.get(),
  trains: trainsStore.get(),
  users: usersStore.get(),
});
const seed = snapshot();
afterEach(() => {
  approvalsStore.set(() => seed.approvals);
  ticketTypesStore.set(() => seed.tickets);
  parkingLotsStore.set(() => seed.lots);
  parkingPricesStore.set(() => seed.parking);
  trainsStore.set(() => seed.trains);
  usersStore.set(() => seed.users);
});

const latest = () => approvalsStore.get()[0];
const approve = () => applyApprovalDecision(latest(), "APPROVED");
const week = {
  code: "WEEK",
  name: "Vé tuần",
  validityHours: 168,
  price: 150000,
  status: "ACTIVE" as const,
};

describe("thêm đối tượng", () => {
  it("chưa ghi gì khi chưa duyệt, duyệt xong mới có", () => {
    expect(requestCreate(ticketTypeCatalog, week)).toBeNull();
    expect(ticketTypesStore.get()).toHaveLength(4);
    expect(latest()).toMatchObject({ type: "TICKET_TYPE", status: "PENDING" });
    expect(approve()).toBeNull();
    expect(ticketTypesStore.get().at(-1)).toMatchObject({ code: "WEEK", price: 150000 });
    expect(latest().status).toBe("APPROVED");
  });

  it("từ chối thì không có gì thay đổi", () => {
    requestCreate(ticketTypeCatalog, week);
    applyApprovalDecision(latest(), "REJECTED", "Chưa cần");
    expect(ticketTypesStore.get()).toHaveLength(4);
    expect(latest()).toMatchObject({ status: "REJECTED", reason: "Chưa cần" });
  });

  it("hai yêu cầu cùng mã: yêu cầu duyệt sau báo xung đột và vẫn ở trạng thái chờ", () => {
    requestCreate(ticketTypeCatalog, week);
    const first = latest();
    requestCreate(ticketTypeCatalog, { ...week, name: "Vé tuần 2" });
    const second = latest();
    expect(applyApprovalDecision(first, "APPROVED")).toBeNull();
    expect(applyApprovalDecision(second, "APPROVED")).toMatch(/Mã loại vé đã tồn tại/);
    expect(approvalsStore.get().find((a) => a.id === second.id)?.status).toBe("PENDING");
    expect(ticketTypesStore.get()).toHaveLength(5);
  });
});

describe("kiểm tra dữ liệu", () => {
  it("bắt trùng mã, thiếu trường và sai định dạng", () => {
    expect(requestCreate(ticketTypeCatalog, { ...week, code: "DAY" })).toMatch(/đã tồn tại/);
    expect(requestCreate(ticketTypeCatalog, { ...week, name: "" })).toMatch(/Vui lòng nhập/);
    expect(requestCreate(ticketTypeCatalog, { ...week, code: "week" })).toMatch(/viết hoa/);
    expect(requestCreate(ticketTypeCatalog, { ...week, price: 0 })).toMatch(/từ 1 trở lên/);
  });

  it("một loại xe và đơn vị chỉ có một giá", () => {
    expect(
      requestCreate(parkingPriceCatalog, { vehicle: "Xe máy", unit: "Lượt", price: 1000 }),
    ).toMatch(/Đã có giá/);
  });

  it("bãi xe phải có sức chứa", () => {
    const lot = parkingLotCatalog.empty();
    expect(
      requestCreate(parkingLotCatalog, { ...lot, code: "X", name: "X", stationId: "S1-1" }),
    ).toMatch(/sức chứa/);
  });
});

describe("sửa đối tượng", () => {
  it("giá gửi xe đổi thật sau khi duyệt, trước đó giữ nguyên", () => {
    requestUpdate(parkingPriceCatalog, "PP4", { vehicle: "Ô tô", unit: "Giờ", price: 25000 });
    expect(parkingPricesStore.get().find((p) => p.id === "PP4")?.price).toBe(20000);
    approve();
    expect(parkingPricesStore.get().find((p) => p.id === "PP4")?.price).toBe(25000);
  });

  it("đổi trạng thái tàu cũng phải chờ duyệt", () => {
    const train = trainsStore.get()[0];
    const { id: _id, ...draft } = train;
    requestUpdate(trainCatalog, train.id, { ...draft, status: "MAINTENANCE" });
    expect(trainsStore.get()[0].status).toBe(train.status);
    expect(latest().changes.map((c) => c.field)).toEqual(["Trạng thái"]);
    approve();
    expect(trainsStore.get()[0].status).toBe("MAINTENANCE");
  });

  it("ngừng bán vé phải chờ duyệt", () => {
    requestUpdate(ticketTypeCatalog, "TT2", {
      code: "DAY",
      name: "Vé ngày",
      validityHours: 24,
      price: 40000,
      status: "INACTIVE",
    });
    expect(ticketTypesStore.get()[0].status).toBe("ACTIVE");
    approve();
    expect(ticketTypesStore.get()[0].status).toBe("INACTIVE");
  });

  it("không thay đổi thì không tạo yêu cầu, đang chờ thì chặn gửi thêm", () => {
    const count = approvalsStore.get().length;
    const draft = { vehicle: "Ô tô", unit: "Giờ", price: 20000 };
    expect(requestUpdate(parkingPriceCatalog, "PP4", draft)).toMatch(/Chưa có thay đổi/);
    expect(approvalsStore.get()).toHaveLength(count);
    requestUpdate(parkingPriceCatalog, "PP4", { ...draft, price: 25000 });
    expect(requestUpdate(parkingPriceCatalog, "PP4", { ...draft, price: 26000 })).toMatch(
      /chờ Manager/,
    );
    expect(requestDelete(parkingPriceCatalog, "PP4", "x")).toMatch(/chờ Manager/);
  });

  it("phân công ga chờ duyệt, nhân viên đã có ga khác thì bị chặn", () => {
    const free = usersStore.get().find((u) => u.role === "STAFF" && u.status === "ACTIVE")!;
    const busy = { ...free, stationId: "S1-1" };
    usersStore.set((list) => list.map((u) => (u.id === free.id ? busy : u)));
    expect(requestUpdate(assignmentCatalog, free.id, { stationId: "S1-2" })).toMatch(
      /Hãy gỡ phân công/,
    );
    requestUpdate(assignmentCatalog, free.id, { stationId: null });
    expect(usersStore.get().find((u) => u.id === free.id)?.stationId).toBe("S1-1");
    approve();
    expect(usersStore.get().find((u) => u.id === free.id)?.stationId).toBeNull();
  });
});

describe("xóa đối tượng", () => {
  it("chỉ xóa sau khi duyệt và lý do nằm trong yêu cầu", () => {
    expect(requestDelete(ticketTypeCatalog, "TT3", "Ít người mua")).toBeNull();
    expect(ticketTypesStore.get().some((t) => t.id === "TT3")).toBe(true);
    expect(latest().changes.at(-1)).toEqual({ field: "Lý do xóa", old: "—", new: "Ít người mua" });
    approve();
    expect(ticketTypesStore.get().some((t) => t.id === "TT3")).toBe(false);
  });

  it("chặn xóa đối tượng đang được dùng", () => {
    expect(requestDelete(ticketTypeCatalog, "TT5", "x")).toMatch(/Ngừng bán/);
    const running = trainsStore.get().find((t) => t.status === "IN_OPERATION")!;
    expect(requestDelete(trainCatalog, running.id, "x")).toMatch(/đang chạy/);
  });

  it("đối tượng đã bị xóa thì yêu cầu sửa không áp dụng được", () => {
    requestUpdate(parkingPriceCatalog, "PP4", { vehicle: "Ô tô", unit: "Giờ", price: 25000 });
    const pending = latest();
    parkingPricesStore.set((list) => list.filter((p) => p.id !== "PP4"));
    expect(applyApprovalDecision(pending, "APPROVED")).toMatch(/không còn tồn tại/);
  });
});

describe("yêu cầu mẫu", () => {
  it("duyệt yêu cầu mẫu có tác dụng thật", () => {
    const find = (type: string) =>
      seed.approvals.find((a) => a.type === type && a.status === "PENDING")!;
    expect(applyApprovalDecision(find("PARKING_PRICE"), "APPROVED")).toBeNull();
    expect(parkingPricesStore.get().find((p) => p.id === "PP2")?.price).toBe(6000);
    expect(applyApprovalDecision(find("TICKET_TYPE"), "APPROVED")).toBeNull();
    expect(ticketTypesStore.get().some((t) => t.code === "WEEK")).toBe(true);
    expect(pendingRequests("ticketType")).toHaveLength(0);
  });
});
