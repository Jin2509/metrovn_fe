import {
  parkingLotsApi,
  ticketProductsApi,
  trainsApi,
  type ParkingLotResponse,
  type TicketProductResponse,
  type TrainResponse,
} from "@/lib/api";
import type { Catalog } from "@/lib/change-requests";
import { TRAIN_STATUS_LABELS } from "@/lib/operations";
import { operationsKeys, toTrain } from "@/lib/operations.queries";
import {
  VEHICLE_LABEL,
  parkingLotsStore,
  parkingPricesStore,
  ticketTypesStore,
  type ParkingLotRow,
  type ParkingPriceRow,
  type TicketTypeRow,
  type VehicleType,
} from "@/stores/admin";
import { linesStore, stationsStore } from "@/stores/metro";
import { trainsStore, type Train } from "@/stores/operations";

// Khai báo các đối tượng nghiệp vụ Admin thêm/sửa/xóa trên bảng. Ghi thẳng lên backend; đổi giá vé
// thì đi qua bảng giá chờ Manager duyệt (xem `pages/tickets`).

const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const money = (value: unknown) => `${Number(value).toLocaleString("vi-VN")} VND`;
/** Giá trị đã có ở đối tượng khác thì báo trùng. */
function taken<T extends { id: string }>(
  all: T[],
  editingId: string | undefined,
  value: string,
  pick: (row: T) => string,
) {
  return all.some((row) => row.id !== editingId && same(pick(row), value));
}
const text = (value: unknown) => String(value ?? "").trim();
const optionalText = (value: unknown) => text(value) || undefined;
const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

// ---------- Vé ----------

export const ticketKeys = {
  products: ["tickets", "products"] as const,
  prices: ["tickets", "prices"] as const,
  fares: ["tickets", "fares"] as const,
};

export const toTicketType = (p: TicketProductResponse): TicketTypeRow => ({
  id: String(p.id),
  code: p.code,
  name: p.name,
  description: p.description ?? "",
  durationUnit: p.durationUnit,
  durationValue: p.durationValue,
  price: p.priceVnd,
  maxPeriods: p.maxPeriods,
  activationWindowDays: p.activationWindowDays,
  status: p.status,
  hasSoldTickets: p.hasSoldTickets,
  version: p.version,
});

type TicketTypeDraft = Omit<TicketTypeRow, "id" | "hasSoldTickets" | "version">;

export const ticketTypeCatalog: Catalog<TicketTypeRow, TicketTypeDraft, TicketProductResponse[]> = {
  key: "ticketType",
  noun: "loại vé",
  store: ticketTypesStore,
  labelOf: (t) => t.name,
  toDraft: ({ id: _id, hasSoldTickets: _sold, version: _version, ...rest }) => rest,
  empty: () => ({
    code: "",
    name: "",
    description: "",
    durationUnit: "DAY",
    durationValue: 1,
    price: 0,
    maxPeriods: 1,
    activationWindowDays: 30,
    status: "ACTIVE",
  }),
  fields: [
    {
      key: "code",
      label: "Mã loại vé",
      required: true,
      createOnly: true,
      hint: "Chữ, số, gạch dưới; không đổi được sau khi tạo",
    },
    { key: "name", label: "Tên loại vé", required: true },
    {
      key: "durationUnit",
      label: "Đơn vị thời hạn",
      type: "select",
      required: true,
      options: () => options({ DAY: "Ngày", WEEK: "Tuần", MONTH: "Tháng" }),
    },
    { key: "durationValue", label: "Thời hạn", type: "number", required: true, min: 1, max: 12 },
    {
      key: "price",
      label: "Giá vé",
      type: "number",
      required: true,
      min: 1,
      createOnly: true,
      format: money,
      hint: "Đổi giá sau khi tạo: dùng nút Đề xuất giá, chờ Manager duyệt",
    },
    {
      key: "maxPeriods",
      label: "Số kỳ tối đa mỗi lần mua",
      type: "number",
      required: true,
      min: 1,
    },
    {
      key: "activationWindowDays",
      label: "Hạn kích hoạt (ngày)",
      type: "number",
      required: true,
      min: 0,
      hint: "Số ngày được chờ trước lần quẹt đầu tiên",
    },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      createOnly: true,
      options: () => options({ ACTIVE: "Đang bán", INACTIVE: "Ngừng bán" }),
      hint: "Sau khi tạo, đổi bằng nút Mở bán / Ngừng bán",
    },
    { key: "description", label: "Mô tả", type: "textarea" },
  ],
  validate: (d, all, editingId) => {
    if (!/^[A-Za-z0-9_]{2,30}$/.test(d.code.trim()))
      return "Mã loại vé gồm 2–30 ký tự chữ, số hoặc _";
    if (taken(all, editingId, d.code, (t) => t.code)) return "Mã loại vé đã tồn tại";
    return null;
  },
  deleteGuard: (t) =>
    t.hasSoldTickets
      ? `${t.name} đã có vé bán ra nên không xóa được, hãy chuyển sang Ngừng bán`
      : null,
  query: {
    key: ticketKeys.products,
    fn: ticketProductsApi.all,
    map: (list) => list.map(toTicketType),
  },
  create: (d) =>
    ticketProductsApi.create({
      code: text(d.code),
      name: text(d.name),
      description: optionalText(d.description),
      durationUnit: d.durationUnit,
      durationValue: Number(d.durationValue),
      priceVnd: Number(d.price),
      maxPeriods: Number(d.maxPeriods),
      activationWindowDays: Number(d.activationWindowDays),
      status: d.status,
    }),
  update: (item, d) =>
    ticketProductsApi.update(Number(item.id), {
      version: item.version,
      name: text(d.name),
      description: text(d.description),
      durationUnit: d.durationUnit,
      durationValue: Number(d.durationValue),
      maxPeriods: Number(d.maxPeriods),
      activationWindowDays: Number(d.activationWindowDays),
    }),
  remove: (item) => ticketProductsApi.remove(Number(item.id)),
  fieldOfApi: { priceVnd: "price" },
};

// ---------- Gửi xe ----------

export const parkingKeys = { lots: ["parking", "lots"] as const };

const VEHICLE_FIELD: Record<VehicleType, "bike" | "moto" | "car"> = {
  BICYCLE: "bike",
  MOTORBIKE: "moto",
  CAR: "car",
};

export function toParkingLot(lot: ParkingLotResponse): ParkingLotRow {
  const capacity = { bike: 0, moto: 0, car: 0 };
  let total = 0;
  let occupied = 0;
  for (const rate of lot.vehicles) {
    capacity[VEHICLE_FIELD[rate.vehicleType]] = rate.capacity;
    total += rate.capacity;
    occupied += rate.occupied;
  }
  return {
    id: String(lot.id),
    code: lot.code,
    name: lot.name,
    stationId: String(lot.stationId),
    address: lot.address ?? "",
    openTime: hhmm(lot.openTime),
    closeTime: hhmm(lot.closeTime),
    ...capacity,
    status: lot.status,
    used: total ? occupied / total : 0,
  };
}

export const toParkingPrices = (lots: ParkingLotResponse[]): ParkingPriceRow[] =>
  lots.flatMap((lot) =>
    lot.vehicles.map((rate) => ({
      id: `${lot.id}:${rate.vehicleType}`,
      lotId: String(lot.id),
      lotName: lot.name,
      vehicleType: rate.vehicleType,
      capacity: rate.capacity,
      occupied: rate.occupied,
      dayPrice: rate.dayPriceVnd,
      overnightPrice: rate.overnightPriceVnd,
      monthlyPrice: rate.monthlyPriceVnd,
      parkAndRideDiscountPercent: rate.parkAndRideDiscountPercent,
    })),
  );

const stationOptions = () =>
  stationsStore
    .get()
    .map((station) => ({ value: station.id, label: `${station.code} · ${station.name}` }));

type ParkingLotDraft = Pick<
  ParkingLotRow,
  "code" | "name" | "stationId" | "address" | "openTime" | "closeTime" | "status"
>;

export const parkingLotCatalog: Catalog<ParkingLotRow, ParkingLotDraft, ParkingLotResponse[]> = {
  key: "parkingLot",
  noun: "bãi xe",
  store: parkingLotsStore,
  labelOf: (l) => l.name,
  toDraft: (l) => ({
    code: l.code,
    name: l.name,
    stationId: l.stationId,
    address: l.address,
    openTime: l.openTime,
    closeTime: l.closeTime,
    status: l.status,
  }),
  empty: () => ({
    code: "",
    name: "",
    stationId: "",
    address: "",
    openTime: "05:00",
    closeTime: "23:00",
    status: "ACTIVE",
  }),
  fields: [
    { key: "code", label: "Mã bãi", required: true, createOnly: true },
    { key: "name", label: "Tên bãi", required: true },
    {
      key: "stationId",
      label: "Ga",
      type: "select",
      required: true,
      createOnly: true,
      options: stationOptions,
    },
    { key: "address", label: "Địa chỉ" },
    { key: "openTime", label: "Giờ mở cửa", type: "time", required: true },
    { key: "closeTime", label: "Giờ đóng cửa", type: "time", required: true },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      options: () => options({ ACTIVE: "Hoạt động", INACTIVE: "Ngừng", MAINTENANCE: "Bảo trì" }),
    },
  ],
  validate: (d, all, editingId) => {
    if (taken(all, editingId, d.code, (l) => l.code)) return "Mã bãi đã tồn tại";
    if (d.openTime === d.closeTime) return "Giờ mở cửa và giờ đóng cửa phải khác nhau";
    return null;
  },
  query: {
    key: parkingKeys.lots,
    fn: () => parkingLotsApi.list(),
    map: (l) => l.map(toParkingLot),
  },
  create: (d) =>
    parkingLotsApi.create({
      stationId: Number(d.stationId),
      code: text(d.code),
      name: text(d.name),
      address: optionalText(d.address),
      openTime: d.openTime,
      closeTime: d.closeTime,
      status: d.status,
    }),
  update: (item, d) =>
    parkingLotsApi.update(Number(item.id), {
      name: text(d.name),
      address: text(d.address),
      openTime: d.openTime,
      closeTime: d.closeTime,
      status: d.status,
    }),
};

type ParkingPriceDraft = Pick<
  ParkingPriceRow,
  | "lotId"
  | "vehicleType"
  | "capacity"
  | "dayPrice"
  | "overnightPrice"
  | "monthlyPrice"
  | "parkAndRideDiscountPercent"
>;

export const parkingPriceCatalog: Catalog<
  ParkingPriceRow,
  ParkingPriceDraft,
  ParkingLotResponse[]
> = {
  key: "parkingPrice",
  noun: "giá gửi xe",
  store: parkingPricesStore,
  labelOf: (p) =>
    "lotName" in p
      ? `${VEHICLE_LABEL[p.vehicleType]} · ${p.lotName}`
      : VEHICLE_LABEL[p.vehicleType],
  toDraft: (p) => ({
    lotId: p.lotId,
    vehicleType: p.vehicleType,
    capacity: p.capacity,
    dayPrice: p.dayPrice,
    overnightPrice: p.overnightPrice,
    monthlyPrice: p.monthlyPrice,
    parkAndRideDiscountPercent: p.parkAndRideDiscountPercent,
  }),
  empty: () => ({
    lotId: "",
    vehicleType: "MOTORBIKE",
    capacity: 0,
    dayPrice: 0,
    overnightPrice: 0,
    monthlyPrice: 0,
    parkAndRideDiscountPercent: 0,
  }),
  fields: [
    {
      key: "lotId",
      label: "Bãi xe",
      type: "select",
      required: true,
      createOnly: true,
      options: () => parkingLotsStore.get().map((l) => ({ value: l.id, label: l.name })),
    },
    {
      key: "vehicleType",
      label: "Loại xe",
      type: "select",
      required: true,
      createOnly: true,
      options: () => options(VEHICLE_LABEL),
    },
    { key: "capacity", label: "Sức chứa (chỗ)", type: "number", required: true, min: 0 },
    {
      key: "dayPrice",
      label: "Giá lượt ban ngày",
      type: "number",
      required: true,
      min: 0,
      format: money,
    },
    {
      key: "overnightPrice",
      label: "Giá qua đêm",
      type: "number",
      required: true,
      min: 0,
      format: money,
    },
    {
      key: "monthlyPrice",
      label: "Giá vé tháng",
      type: "number",
      required: true,
      min: 0,
      format: money,
    },
    {
      key: "parkAndRideDiscountPercent",
      label: "Giảm khi đi Metro (%)",
      type: "number",
      min: 0,
      max: 100,
      hint: "Gửi xe kết hợp đi Metro trong ngày",
    },
  ],
  validate: (d, all, editingId) =>
    !editingId && all.some((p) => p.lotId === d.lotId && p.vehicleType === d.vehicleType)
      ? `Bãi này đã có giá cho ${VEHICLE_LABEL[d.vehicleType].toLowerCase()}, hãy sửa dòng đó`
      : null,
  query: { key: parkingKeys.lots, fn: () => parkingLotsApi.list(), map: toParkingPrices },
  create: (d) => upsertRate(d.lotId, d),
  update: (item, d) => upsertRate(item.lotId, { ...d, vehicleType: item.vehicleType }),
};

function upsertRate(lotId: string, d: ParkingPriceDraft) {
  return parkingLotsApi.upsertRate(Number(lotId), d.vehicleType, {
    capacity: Number(d.capacity),
    dayPriceVnd: Number(d.dayPrice),
    overnightPriceVnd: Number(d.overnightPrice),
    monthlyPriceVnd: Number(d.monthlyPrice),
    parkAndRideDiscountPercent: Number(d.parkAndRideDiscountPercent || 0),
  });
}

// ---------- Tàu ----------

type TrainDraft = Omit<Train, "id">;

const optionalNumber = (value: unknown) =>
  value === "" || value === null || value === undefined ? undefined : Number(value);

export const trainCatalog: Catalog<Train, TrainDraft, TrainResponse[]> = {
  key: "train",
  noun: "đoàn tàu",
  store: trainsStore,
  labelOf: (t) => t.code,
  toDraft: ({ id: _id, ...rest }) => rest,
  empty: () => ({
    code: "",
    name: "",
    lineId: linesStore.get()[0]?.id ?? "",
    capacity: 930,
    manufactureYear: new Date().getFullYear(),
    status: "READY",
  }),
  fields: [
    { key: "code", label: "Mã tàu", required: true },
    { key: "name", label: "Tên tàu" },
    {
      key: "lineId",
      label: "Tuyến",
      type: "select",
      options: () => linesStore.get().map((line) => ({ value: line.id, label: line.code })),
    },
    { key: "capacity", label: "Sức chứa (khách)", type: "number", min: 1, max: 5000 },
    { key: "manufactureYear", label: "Năm sản xuất", type: "number", min: 1901, max: 2100 },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      options: () => options(TRAIN_STATUS_LABELS),
    },
  ],
  validate: (d, all, editingId) =>
    taken(all, editingId, d.code, (t) => t.code) ? "Mã tàu đã tồn tại" : null,
  deleteGuard: (t) =>
    t.status === "IN_OPERATION" ? `${t.code} đang chạy, hãy đổi trạng thái trước khi xóa` : null,
  query: { key: operationsKeys.trains, fn: trainsApi.all, map: (l) => l.map(toTrain) },
  create: (d) =>
    trainsApi.create({
      code: text(d.code),
      nameTrain: optionalText(d.name),
      lineId: optionalNumber(d.lineId),
      capacity: optionalNumber(d.capacity),
      manufactureYear: optionalNumber(d.manufactureYear),
      status: d.status,
    }),
  update: (item, d) =>
    trainsApi.update(Number(item.id), {
      code: text(d.code),
      nameTrain: optionalText(d.name),
      lineId: optionalNumber(d.lineId),
      capacity: optionalNumber(d.capacity),
      manufactureYear: optionalNumber(d.manufactureYear),
      status: d.status === item.status ? undefined : d.status,
    }),
  remove: (item) => trainsApi.remove(Number(item.id)),
  fieldOfApi: { nameTrain: "name" },
};
