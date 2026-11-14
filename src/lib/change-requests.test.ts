import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  parkingLotsApi,
  ticketProductsApi,
  trainsApi,
  type ParkingLotResponse,
  type TicketProductResponse,
  type TrainResponse,
} from "@/lib/api";
import {
  parkingLotCatalog,
  parkingPriceCatalog,
  ticketTypeCatalog,
  toParkingLot,
  toParkingPrices,
  toTicketType,
  trainCatalog,
} from "@/lib/catalogs";
import {
  catalogErrorMessage,
  deleteCatalogItem,
  saveCatalogItem,
  validateDraft,
} from "@/lib/change-requests";
import { toTrain } from "@/lib/operations.queries";
import { parkingLotsStore, parkingPricesStore, ticketTypesStore } from "@/stores/admin";
import { trainsStore } from "@/stores/operations";

const product = (patch: Partial<TicketProductResponse> = {}): TicketProductResponse => ({
  id: 1,
  code: "DAY",
  name: "Vé ngày",
  description: null,
  durationUnit: "DAY",
  durationValue: 1,
  priceVnd: 40_000,
  maxPeriods: 1,
  activationWindowDays: 30,
  status: "ACTIVE",
  hasSoldTickets: false,
  createdBy: null,
  updatedBy: null,
  version: 4,
  createdAt: "",
  updatedAt: "",
  ...patch,
});

const train = (patch: Partial<TrainResponse> = {}): TrainResponse => ({
  id: 10,
  code: "T01",
  nameTrain: "Tàu 1",
  lineId: 1,
  lineCode: "L1",
  lineName: "Tuyến 1",
  capacity: 930,
  manufactureYear: 2020,
  status: "READY",
  createdAt: "",
  updatedAt: "",
  ...patch,
});

const lot: ParkingLotResponse = {
  id: 3,
  code: "BT-P1",
  name: "Bãi Bến Thành",
  address: null,
  stationId: 1,
  stationCode: "L1-01",
  stationName: "Bến Thành",
  openTime: "05:00:00",
  closeTime: "23:00:00",
  status: "ACTIVE",
  openNow: true,
  vehicles: [
    {
      vehicleType: "MOTORBIKE",
      capacity: 200,
      occupied: 150,
      available: 50,
      dayPriceVnd: 5_000,
      overnightPriceVnd: 10_000,
      monthlyPriceVnd: 100_000,
      parkAndRideDiscountPercent: 20,
    },
    {
      vehicleType: "CAR",
      capacity: 50,
      occupied: 50,
      available: 0,
      dayPriceVnd: 30_000,
      overnightPriceVnd: 50_000,
      monthlyPriceVnd: 1_000_000,
      parkAndRideDiscountPercent: 0,
    },
  ],
};

beforeEach(() => {
  ticketTypesStore.set(() => [
    toTicketType(product()),
    toTicketType(product({ id: 2, code: "WEEK", name: "Vé tuần", hasSoldTickets: true })),
  ]);
  trainsStore.set(() => [
    toTrain(train()),
    toTrain(train({ id: 11, code: "T02", status: "IN_OPERATION" })),
  ]);
  parkingLotsStore.set(() => [toParkingLot(lot)]);
  parkingPricesStore.set(() => toParkingPrices([lot]));
});
afterEach(() => vi.restoreAllMocks());

describe("chuyển dữ liệu backend", () => {
  it("bãi xe gộp sức chứa theo loại xe và tính tỉ lệ lấp đầy", () => {
    expect(toParkingLot(lot)).toMatchObject({
      id: "3",
      stationId: "1",
      openTime: "05:00",
      moto: 200,
      car: 50,
      bike: 0,
      used: 200 / 250,
    });
    expect(toParkingPrices([lot]).map((p) => p.id)).toEqual(["3:MOTORBIKE", "3:CAR"]);
  });
});

describe("kiểm tra dữ liệu trước khi gửi", () => {
  it("bắt trùng mã, thiếu trường và sai định dạng", () => {
    const draft = ticketTypeCatalog.empty();
    expect(validateDraft(ticketTypeCatalog, { ...draft, name: "Vé tháng" })).toMatch(/mã loại vé/i);
    expect(validateDraft(ticketTypeCatalog, { ...draft, code: "DAY", name: "x", price: 1 })).toBe(
      "Mã loại vé đã tồn tại",
    );
    expect(validateDraft(ticketTypeCatalog, { ...draft, code: "M", name: "x", price: 1 })).toMatch(
      /2–30 ký tự/,
    );
    expect(validateDraft(trainCatalog, { ...trainCatalog.empty(), code: "t01" })).toBe(
      "Mã tàu đã tồn tại",
    );
  });

  it("mỗi bãi chỉ có một dòng giá cho một loại xe", () => {
    expect(
      validateDraft(parkingPriceCatalog, {
        ...parkingPriceCatalog.empty(),
        lotId: "3",
        vehicleType: "CAR",
      }),
    ).toMatch(/đã có giá cho ô tô/);
  });

  it("giờ mở và đóng cửa bãi xe phải khác nhau", () => {
    expect(
      validateDraft(parkingLotCatalog, {
        ...parkingLotCatalog.empty(),
        code: "NEW",
        name: "Bãi mới",
        stationId: "1",
        openTime: "06:00",
        closeTime: "06:00",
      }),
    ).toMatch(/khác nhau/);
  });
});

describe("lưu lên backend", () => {
  it("thêm loại vé gửi đủ trường, mã đã cắt khoảng trắng", async () => {
    const create = vi.spyOn(ticketProductsApi, "create").mockResolvedValue(product());
    const error = await saveCatalogItem(ticketTypeCatalog, {
      ...ticketTypeCatalog.empty(),
      code: " MONTH ",
      name: "Vé tháng",
      durationUnit: "MONTH",
      price: 300_000,
    });
    expect(error).toBeNull();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ code: "MONTH", durationUnit: "MONTH", priceVnd: 300_000 }),
    );
  });

  it("sửa loại vé gửi kèm version, không gửi giá (giá đổi qua đề xuất)", async () => {
    const update = vi.spyOn(ticketProductsApi, "update").mockResolvedValue(product());
    const item = ticketTypesStore.get()[0];
    await saveCatalogItem(
      ticketTypeCatalog,
      { ...ticketTypeCatalog.toDraft(item), name: "Vé 1 ngày" },
      item.id,
    );
    expect(update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ version: 4, name: "Vé 1 ngày" }),
    );
    expect(update.mock.calls[0][1]).not.toHaveProperty("priceVnd");
  });

  it("không thay đổi gì thì không gọi API", async () => {
    const update = vi.spyOn(trainsApi, "update");
    const item = trainsStore.get()[0];
    expect(await saveCatalogItem(trainCatalog, trainCatalog.toDraft(item), item.id)).toBe(
      "Chưa có thay đổi nào",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("sửa tàu chỉ gửi trạng thái khi trạng thái thật sự đổi", async () => {
    const update = vi.spyOn(trainsApi, "update").mockResolvedValue(train());
    const item = trainsStore.get()[0];
    await saveCatalogItem(trainCatalog, { ...trainCatalog.toDraft(item), capacity: 1000 }, item.id);
    expect(update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ capacity: 1000, status: undefined }),
    );
  });

  it("giá gửi xe ghi theo bãi và loại xe", async () => {
    const upsert = vi.spyOn(parkingLotsApi, "upsertRate").mockResolvedValue(lot);
    const item = parkingPricesStore.get()[0];
    await saveCatalogItem(
      parkingPriceCatalog,
      { ...parkingPriceCatalog.toDraft(item), dayPrice: 6_000 },
      item.id,
    );
    expect(upsert).toHaveBeenCalledWith(
      3,
      "MOTORBIKE",
      expect.objectContaining({ dayPriceVnd: 6_000 }),
    );
  });

  it("lỗi backend thành thông báo; lỗi theo trường hiện nhãn tiếng Việt", async () => {
    vi.spyOn(trainsApi, "create").mockRejectedValue(new ApiError(409, "Mã tàu đã tồn tại"));
    expect(await saveCatalogItem(trainCatalog, { ...trainCatalog.empty(), code: "T99" })).toBe(
      "Mã tàu đã tồn tại",
    );
    expect(
      catalogErrorMessage(trainCatalog, new ApiError(400, "Bad", { nameTrain: "size must be" })),
    ).toBe("Tên tàu không hợp lệ");
  });
});

describe("xóa", () => {
  it("chặn xóa đối tượng đang được dùng mà không gọi API", async () => {
    const remove = vi.spyOn(trainsApi, "remove");
    expect(await deleteCatalogItem(trainCatalog, trainsStore.get()[1])).toMatch(/đang chạy/);
    expect(await deleteCatalogItem(ticketTypeCatalog, ticketTypesStore.get()[1])).toMatch(
      /đã có vé bán ra/,
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("xóa được thì gọi API theo mã số", async () => {
    const remove = vi.spyOn(trainsApi, "remove").mockResolvedValue(undefined);
    expect(await deleteCatalogItem(trainCatalog, trainsStore.get()[0])).toBeNull();
    expect(remove).toHaveBeenCalledWith(10);
  });
});
