import type { AnyCatalog, Catalog } from "@/lib/change-requests";
import { TRAIN_STATUS_LABELS } from "@/lib/operations";
import {
  parkingLotsStore,
  parkingPricesStore,
  ticketTypesStore,
  usersStore,
  type ParkingLotRow,
  type TicketTypeRow,
  type User,
} from "@/mocks/admin";
import { STUDENT_ONLY_TICKET_ID } from "@/mocks/green";
import { lines, stationsStore, stations } from "@/mocks/metro";
import { trainsStore, type Train } from "@/mocks/operations";
import { studentSchoolsStore, type StudentSchool } from "@/mocks/student-verifications";

// Khai báo các đối tượng nghiệp vụ Admin được thêm/sửa/xóa. Mọi thay đổi đều đi qua Manager.

let idSeq = 0;
/** Phần đuôi mã đối tượng mới, không trùng kể cả khi tạo liên tiếp. */
const stamp = () => `${Date.now()}-${++idSeq}`;
const options = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const money = (value: unknown) => `${Number(value).toLocaleString("vi-VN")} VND`;
function dropId<T extends { id: string }>({ id: _id, ...rest }: T): Omit<T, "id"> {
  return rest;
}
/** Giá trị đã có ở đối tượng khác thì báo trùng. */
function taken<T extends { id: string }>(
  all: T[],
  editingId: string | undefined,
  value: string,
  pick: (row: T) => string,
) {
  return all.some((row) => row.id !== editingId && same(pick(row), value));
}

const STATUS_LABELS = { ACTIVE: "Hoạt động", INACTIVE: "Ngừng" };

// ---------- Vé ----------

export const ticketTypeCatalog: Catalog<TicketTypeRow> = {
  key: "ticketType",
  type: "TICKET_TYPE",
  noun: "loại vé",
  store: ticketTypesStore,
  newId: () => `TT${stamp()}`,
  labelOf: (t) => t.name,
  toDraft: dropId,
  empty: () => ({
    code: "",
    name: "",
    validityHours: 24,
    price: 0,
    status: "ACTIVE",
  }),
  fields: [
    { key: "code", label: "Mã loại vé", required: true, hint: "Viết hoa, ví dụ WEEK" },
    { key: "name", label: "Tên loại vé", required: true },
    { key: "validityHours", label: "Hiệu lực (giờ)", type: "number", required: true, min: 1 },
    { key: "price", label: "Giá vé", type: "number", required: true, min: 1, format: money },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      options: () => options({ ACTIVE: "Đang bán", INACTIVE: "Ngừng bán" }),
    },
  ],
  validate: (d, all, editingId) => {
    if (!/^[A-Z][A-Z0-9_]{1,29}$/.test(d.code))
      return "Mã loại vé viết hoa, gồm 2–30 ký tự A-Z, 0-9, _";
    if (taken(all, editingId, d.code, (t) => t.code)) return "Mã loại vé đã tồn tại";
    if (taken(all, editingId, d.name, (t) => t.name)) return "Tên loại vé đã tồn tại";
    return null;
  },
  deleteGuard: (t) =>
    t.id === STUDENT_ONLY_TICKET_ID
      ? `${t.name} gắn với luồng đặt vé của app nên không xóa được, hãy chuyển sang Ngừng bán`
      : null,
};

// ---------- Gửi xe ----------

const stationOptions = () =>
  stationsStore
    .get()
    .map((station) => ({ value: station.id, label: `${station.code} · ${station.name}` }));

export const parkingLotCatalog: Catalog<ParkingLotRow> = {
  key: "parkingLot",
  type: "PARKING_LOT",
  noun: "bãi xe",
  store: parkingLotsStore,
  newId: () => `PK${stamp()}`,
  labelOf: (l) => l.name,
  toDraft: dropId,
  empty: () => ({
    code: "",
    name: "",
    stationId: "",
    bike: 0,
    moto: 0,
    car: 0,
    status: "ACTIVE",
    used: 0,
  }),
  fields: [
    { key: "code", label: "Mã bãi", required: true },
    { key: "name", label: "Tên bãi", required: true },
    { key: "stationId", label: "Ga", type: "select", required: true, options: stationOptions },
    { key: "bike", label: "Sức chứa xe đạp", type: "number", required: true, min: 0 },
    { key: "moto", label: "Sức chứa xe máy", type: "number", required: true, min: 0 },
    { key: "car", label: "Sức chứa ô tô", type: "number", required: true, min: 0 },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      options: () => options({ ...STATUS_LABELS, MAINTENANCE: "Bảo trì" }),
    },
  ],
  validate: (d, all, editingId) => {
    if (taken(all, editingId, d.code, (l) => l.code)) return "Mã bãi đã tồn tại";
    if (!(Number(d.bike) + Number(d.moto) + Number(d.car) > 0))
      return "Bãi xe phải có sức chứa cho ít nhất một loại xe";
    return null;
  },
};

export type ParkingPriceRow = ReturnType<typeof parkingPricesStore.get>[number];

export const parkingPriceCatalog: Catalog<ParkingPriceRow> = {
  key: "parkingPrice",
  type: "PARKING_PRICE",
  noun: "giá gửi xe",
  store: parkingPricesStore,
  newId: () => `PP${stamp()}`,
  labelOf: (p) => `${p.vehicle} / ${p.unit}`,
  toDraft: dropId,
  empty: () => ({ vehicle: "Xe máy", unit: "Lượt", price: 0 }),
  fields: [
    {
      key: "vehicle",
      label: "Loại xe",
      type: "select",
      required: true,
      options: () => ["Xe đạp", "Xe máy", "Ô tô"].map((v) => ({ value: v, label: v })),
    },
    {
      key: "unit",
      label: "Đơn vị tính",
      type: "select",
      required: true,
      options: () => ["Lượt", "Giờ", "Ngày", "Tháng"].map((v) => ({ value: v, label: v })),
    },
    { key: "price", label: "Giá", type: "number", required: true, min: 1, format: money },
  ],
  validate: (d, all, editingId) =>
    all.some((p) => p.id !== editingId && p.vehicle === d.vehicle && p.unit === d.unit)
      ? `Đã có giá cho ${d.vehicle} theo ${d.unit.toLowerCase()}`
      : null,
};

// ---------- Tàu ----------

export const trainCatalog: Catalog<Train> = {
  key: "train",
  type: "TRAIN",
  noun: "đoàn tàu",
  store: trainsStore,
  newId: () => `T${stamp()}`,
  labelOf: (t) => t.code,
  toDraft: dropId,
  empty: () => ({
    code: "",
    name: "",
    lineId: "L1",
    capacity: 930,
    manufactureYear: new Date().getFullYear(),
    status: "READY",
  }),
  fields: [
    { key: "code", label: "Mã tàu", required: true },
    { key: "name", label: "Tên tàu", required: true },
    {
      key: "lineId",
      label: "Tuyến",
      type: "select",
      required: true,
      options: () => lines.map((line) => ({ value: line.id, label: line.code })),
    },
    { key: "capacity", label: "Sức chứa (khách)", type: "number", required: true, min: 1 },
    { key: "manufactureYear", label: "Năm sản xuất", type: "number", required: true, min: 1990 },
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
};

// ---------- Phân công ga ----------

export type AssignmentDraft = { stationId: string | null };

const stationName = (id: unknown) => stations.find((s) => s.id === id)?.name;

export const assignmentCatalog: Catalog<User, AssignmentDraft> = {
  key: "assignment",
  type: "ASSIGNMENT",
  noun: "phân công ga",
  store: usersStore,
  newId: () => `U${stamp()}`,
  labelOf: (u) => ("name" in u ? u.name : ""),
  toDraft: (u) => ({ stationId: u.stationId }),
  empty: () => ({ stationId: null }),
  fields: [
    {
      key: "stationId",
      label: "Ga phụ trách",
      format: (id) => stationName(id) ?? "Chưa phân công",
    },
  ],
  validate: (d, all, editingId) => {
    const user = all.find((u) => u.id === editingId);
    if (!user) return "Vui lòng chọn nhân viên và ga";
    if (!d.stationId) return null;
    if (user.status !== "ACTIVE") return "Nhân viên đã nghỉ hoặc bị khóa, không thể phân công";
    if (user.stationId && user.stationId !== d.stationId)
      return `Nhân viên đã được phân công ga ${stationName(user.stationId)}. Hãy gỡ phân công trước.`;
    return null;
  },
};

// ---------- Xác nhận sinh viên ----------

export const schoolCatalog: Catalog<StudentSchool> = {
  key: "school",
  type: "SCHOOL",
  noun: "trường",
  store: studentSchoolsStore,
  newId: () => `SCH${stamp()}`,
  labelOf: (s) => s.name,
  toDraft: dropId,
  empty: () => ({ name: "" }),
  fields: [
    { key: "name", label: "Tên trường", required: true, hint: "Đúng như in trên thẻ sinh viên" },
  ],
  validate: (d, all, editingId) =>
    taken(all, editingId, d.name, (s) => s.name) ? "Trường đã có trong danh sách" : null,
  deleteGuard: () =>
    studentSchoolsStore.get().length <= 1 ? "Danh sách trường không được trống" : null,
};

export const CATALOGS: Record<string, AnyCatalog> = Object.fromEntries(
  [
    ticketTypeCatalog,
    parkingLotCatalog,
    parkingPriceCatalog,
    trainCatalog,
    assignmentCatalog,
    schoolCatalog,
  ].map((catalog) => [catalog.key, catalog as AnyCatalog]),
);
