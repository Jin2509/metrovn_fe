import { getActorName } from "@/lib/auth/session.store";
import { hasPendingApproval, logAction, submitApproval } from "@/mocks/admin";
import {
  lineStationRows,
  lineStationsStore,
  lines,
  replaceStations,
  stationsStore,
  type LineStation,
  type Station,
  type StationStatus,
} from "@/mocks/metro";

// Nghiệp vụ "Quản lý nhà ga và tuyến đường" (UC4): thêm/sửa ga, sắp xếp thứ tự ga (UC4-01),
// lý trình giữa các ga — dữ liệu nền cho tra cứu lộ trình, giá vé theo cự ly và chatbot.
//
// Ga và tuyến là dữ liệu nền tảng dùng chung cho tra cứu lộ trình, giá vé và chatbot, nên Admin
// không được tự ý ghi thẳng vào kho dữ liệu: mọi thêm/sửa/xóa chỉ được ĐỀ XUẤT (hàm `request*`
// dưới đây tạo một yêu cầu phê duyệt kiểu "STATION"/"LINE"), Manager duyệt ở trang Phê duyệt thì
// hàm `apply*` mới thực sự ghi vào `stationsStore`/`lineStationsStore` (xem `approvals.service.ts`).

export const STATION_STATUS_LABELS: Record<StationStatus, string> = {
  ACTIVE: "Hoạt động",
  MAINTENANCE: "Bảo trì",
  INACTIVE: "Ngừng / chưa khai thác",
};

export const stationName = (id: string | undefined) =>
  stationsStore.get().find((s) => s.id === id)?.name ?? "—";
export const lineCode = (id: string | undefined) => lines.find((l) => l.id === id)?.code ?? "—";

// ---------- Ga ----------

export type StationDraft = Pick<
  Station,
  "code" | "name" | "address" | "district" | "lat" | "lng" | "interchange" | "status"
>;
export type StationErrors = Partial<Record<keyof StationDraft, string>>;

export function validateStation(
  draft: StationDraft,
  all: Station[],
  editingId?: string,
): StationErrors {
  const errors: StationErrors = {};
  if (!/^[A-Z0-9-]{2,20}$/.test(draft.code.trim()))
    errors.code = "Mã ga gồm 2–20 ký tự in hoa, số hoặc dấu gạch";
  else if (all.some((s) => s.id !== editingId && s.code === draft.code.trim()))
    errors.code = "Mã ga đã tồn tại";
  if (draft.name.trim().length < 2) errors.name = "Thông tin đang bị thiếu";
  else if (
    all.some((s) => s.id !== editingId && s.name.toLowerCase() === draft.name.trim().toLowerCase())
  )
    errors.name = "Tên ga đã tồn tại";
  if (!(draft.lat >= -90 && draft.lat <= 90)) errors.lat = "Vĩ độ phải trong khoảng −90 đến 90";
  if (!(draft.lng >= -180 && draft.lng <= 180))
    errors.lng = "Kinh độ phải trong khoảng −180 đến 180";
  return errors;
}

/**
 * Ghi thật vào kho ga. Chỉ `applyStationApproval` (sau khi Manager duyệt) được gọi hàm này từ
 * màn hình quản lý ga — hàm vẫn export để unit test kiểm tra trực tiếp logic ghi dữ liệu.
 */
export function saveStation(draft: StationDraft, editingId?: string): Station {
  const all = stationsStore.get();
  const clean = { ...draft, code: draft.code.trim(), name: draft.name.trim() };
  let saved: Station;
  if (editingId) {
    saved = { ...all.find((s) => s.id === editingId)!, ...clean };
    replaceStations(all.map((s) => (s.id === editingId ? saved : s)));
  } else {
    saved = { ...clean, id: `S-${Date.now()}`, lineIds: [], order: 0, dailyFlow: 0 };
    replaceStations([...all, saved]);
  }
  logAction(editingId ? "Sửa ga" : "Thêm ga", `${saved.code} · ${saved.name}`);
  return saved;
}

export type StationApprovalPayload =
  | { action: "CREATE"; draft: StationDraft }
  | { action: "UPDATE"; id: string; draft: StationDraft }
  | { action: "DELETE"; id: string };

const stationField = (key: keyof StationDraft, v: StationDraft) =>
  key === "status"
    ? STATION_STATUS_LABELS[v.status]
    : key === "interchange"
      ? v.interchange
        ? "Có"
        : "Không"
      : String(v[key]);
const STATION_FIELD_LABELS: Record<keyof StationDraft, string> = {
  code: "Mã ga",
  name: "Tên ga",
  address: "Địa chỉ",
  district: "Quận/huyện",
  lat: "Vĩ độ",
  lng: "Kinh độ",
  interchange: "Ga chuyển tuyến",
  status: "Trạng thái",
};

/**
 * Admin đề xuất thêm/sửa ga — không ghi vào kho dữ liệu, chỉ tạo yêu cầu phê duyệt (STATION)
 * cho Manager. Trả về `null` khi gửi thành công, hoặc thông báo lỗi khi không có gì thay đổi.
 */
export function requestStationUpsert(draft: StationDraft, editingId?: string): string | null {
  const keys = Object.keys(STATION_FIELD_LABELS) as (keyof StationDraft)[];
  if (editingId) {
    const current = stationsStore.get().find((s) => s.id === editingId);
    if (!current) return "Không tìm thấy ga";
    const changes = keys
      .filter((k) => stationField(k, current) !== stationField(k, draft))
      .map((k) => ({
        field: STATION_FIELD_LABELS[k],
        old: stationField(k, current),
        new: stationField(k, draft),
      }));
    if (!changes.length) return "Chưa có thay đổi nào";
    if (hasPendingApproval("STATION", (p) => (p as { id?: string })?.id === editingId))
      return "Ga này đang có một yêu cầu chờ Manager duyệt";
    submitApproval("STATION", `Sửa ga: ${current.code} · ${current.name}`, changes, {
      action: "UPDATE",
      id: editingId,
      draft,
    } satisfies StationApprovalPayload);
    return null;
  }
  const changes = keys.map((k) => ({
    field: STATION_FIELD_LABELS[k],
    old: "—",
    new: stationField(k, draft),
  }));
  submitApproval("STATION", `Thêm ga: ${draft.code || "?"} · ${draft.name || "?"}`, changes, {
    action: "CREATE",
    draft,
  } satisfies StationApprovalPayload);
  return null;
}

/**
 * Admin đề xuất xóa ga — chặn khi ga vẫn thuộc một tuyến (phải gỡ khỏi tuyến trước) để không
 * phá vỡ dữ liệu lý trình/giá vé đang tham chiếu đến ga này.
 */
export function requestStationDelete(station: Station, reason: string): string | null {
  if (station.lineIds.length)
    return `Ga đang thuộc tuyến ${station.lineIds.map(lineCode).join(", ")}. Hãy gỡ ga khỏi tuyến ở tab "Tuyến & thứ tự ga" trước khi xóa.`;
  if (hasPendingApproval("STATION", (p) => (p as { id?: string })?.id === station.id))
    return "Ga này đang có một yêu cầu chờ Manager duyệt";
  submitApproval(
    "STATION",
    `Xóa ga: ${station.code} · ${station.name}`,
    [
      { field: "Trạng thái", old: "Đang tồn tại", new: "Đề nghị xóa" },
      { field: "Lý do", old: "—", new: reason },
    ],
    { action: "DELETE", id: station.id } satisfies StationApprovalPayload,
  );
  return null;
}

/** Áp dụng quyết định của Manager với một yêu cầu STATION — chỉ gọi khi `status === "APPROVED"`. */
export function applyStationApproval(payload: StationApprovalPayload) {
  if (payload.action === "CREATE") saveStation(payload.draft);
  else if (payload.action === "UPDATE") saveStation(payload.draft, payload.id);
  else {
    const station = stationsStore.get().find((s) => s.id === payload.id);
    if (!station || station.lineIds.length) return; // an toàn: không xóa ga vẫn đang gắn tuyến
    replaceStations(stationsStore.get().filter((s) => s.id !== payload.id));
    logAction("Xóa ga", `${station.code} · ${station.name}`);
  }
}

// ---------- Tuyến – ga ----------

/** Lý trình cộng dồn (km) và thời gian chạy cộng dồn (giây, đã gồm thời gian dừng các ga trước). */
export function chainage(rows: LineStation[]) {
  let km = 0;
  let sec = 0;
  return rows.map((r, i) => {
    if (i > 0) {
      km += r.distanceFromPrevKm ?? 0;
      sec += (r.travelTimeFromPrevSec ?? 0) + rows[i - 1].dwellSec;
    }
    return { ...r, km, sec };
  });
}

/** Thời gian chạy một chiều (phút) = Σ thời gian chạy giữa các ga + Σ thời gian dừng ở các ga giữa. */
export function runningTimeMinutes(lineId: string, rows = lineStationsStore.get()) {
  const list = chainage(lineStationRows(lineId, rows));
  return Math.round((list.at(-1)?.sec ?? 0) / 60);
}

export const ORDER_ERROR = "Thứ tự ga không hợp lệ";

/**
 * Kiểm tra trước khi lưu thứ tự ga (UC4-01): số thứ tự liên tục từ 1, không trùng ga,
 * khoảng cách và thời gian chạy > 0 với mọi ga trừ ga đầu. Lưu toàn bộ hoặc không lưu gì.
 */
export function validateLineOrder(rows: LineStation[]): string[] {
  const errors: string[] = [];
  const orders = rows.map((r) => r.order).sort((a, b) => a - b);
  if (
    !orders.every((o, i) => o === i + 1) ||
    new Set(rows.map((r) => r.stationId)).size !== rows.length
  )
    errors.push(`${ORDER_ERROR}: số thứ tự bị trùng, thiếu hoặc lặp ga`);
  const sorted = [...rows].sort((a, b) => a.order - b.order);
  sorted.slice(1).forEach((r) => {
    if (
      !(r.distanceFromPrevKm && r.distanceFromPrevKm > 0) ||
      !(r.travelTimeFromPrevSec && r.travelTimeFromPrevSec > 0)
    )
      errors.push(`Ga thứ ${r.order}: khoảng cách và thời gian chạy từ ga trước phải lớn hơn 0`);
  });
  return errors;
}

/**
 * Ghi thật thứ tự ga vào kho dữ liệu. Chỉ `applyLineOrderApproval` (sau khi Manager duyệt) được
 * gọi hàm này từ màn hình Tuyến & thứ tự ga — hàm vẫn export để unit test kiểm tra trực tiếp.
 */
export function saveLineOrder(lineId: string, rows: LineStation[]) {
  const sorted = [...rows]
    .sort((a, b) => a.order - b.order)
    .map((r, i) => ({
      ...r,
      order: i + 1,
      ...(i === 0 ? { distanceFromPrevKm: null, travelTimeFromPrevSec: null } : {}),
    }));
  lineStationsStore.set((all) => [...all.filter((r) => r.lineId !== lineId), ...sorted]);
  logAction("Sắp xếp thứ tự ga", `${lineCode(lineId)} · ${getActorName()}`);
  return sorted;
}

export type LineApprovalPayload = { lineId: string; rows: LineStation[] };

/**
 * Admin đề xuất thứ tự ga / lý trình mới cho một tuyến — không ghi vào kho dữ liệu, chỉ tạo
 * yêu cầu phê duyệt (LINE) cho Manager vì thay đổi này ảnh hưởng trực tiếp đến giá vé lượt và
 * tra cứu lộ trình. Gọi sau khi `validateLineOrder` đã qua. Trả về `null` khi gửi thành công.
 */
export function requestLineOrderChange(lineId: string, rows: LineStation[]): string | null {
  if (hasPendingApproval("LINE", (p) => (p as LineApprovalPayload)?.lineId === lineId))
    return "Tuyến này đang có một yêu cầu chờ Manager duyệt";
  const before = chainage(lineStationRows(lineId));
  const after = chainage([...rows].sort((a, b) => a.order - b.order));
  const km = (n: number) => `${n.toFixed(2)} km`;
  const min = (sec: number) => `${Math.round(sec / 60)} phút`;
  submitApproval(
    "LINE",
    `Cập nhật thứ tự ga: ${lineCode(lineId)}`,
    [
      { field: "Số ga", old: String(before.length), new: String(after.length) },
      {
        field: "Chiều dài tuyến",
        old: km(before.at(-1)?.km ?? 0),
        new: km(after.at(-1)?.km ?? 0),
      },
      {
        field: "Thời gian chạy một chiều",
        old: min(before.at(-1)?.sec ?? 0),
        new: min(after.at(-1)?.sec ?? 0),
      },
    ],
    { lineId, rows } satisfies LineApprovalPayload,
  );
  return null;
}

/** Áp dụng quyết định của Manager với một yêu cầu LINE — chỉ gọi khi `status === "APPROVED"`. */
export function applyLineOrderApproval(payload: LineApprovalPayload) {
  saveLineOrder(payload.lineId, payload.rows);
}
