import {
  ApiError,
  type StationApiStatus,
  type StationResponse,
  type UpdateStationBody,
} from "@/lib/api";
import { haversine } from "@/lib/geo";
import type { StationDraft, StationErrors } from "@/pages/stations/stations.types";

export const STATION_STATUS_LABELS: Record<StationApiStatus, string> = {
  ACTIVE: "Hoạt động",
  MAINTENANCE: "Bảo trì",
  INACTIVE: "Tạm ngừng",
};

export const EMPTY_STATION_DRAFT: StationDraft = {
  code: "",
  name: "",
  address: "",
  district: "",
  imageUrl: "",
  lat: "10.7769",
  lng: "106.7009",
  interchange: false,
  status: "ACTIVE",
};

export const toStationDraft = (s: StationResponse): StationDraft => ({
  code: s.code,
  name: s.nameStation,
  address: s.address ?? "",
  district: s.district ?? "",
  imageUrl: s.imageUrl ?? "",
  lat: String(s.latitude),
  lng: String(s.longitude),
  interchange: s.isInterchange,
  status: s.status,
});

const toNumber = (value: string) => (value.trim() === "" ? NaN : Number(value));

/** Mã ga/tuyến: chữ in hoa, số, gạch ngang hoặc gạch dưới; không khoảng trắng, không dấu. */
export const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;
export const CODE_RULE = "Mã chỉ gồm chữ in hoa không dấu, số, gạch ngang hoặc gạch dưới";

/** Khung toạ độ Việt Nam và vùng TP.HCM mở rộng (để cảnh báo nhập nhầm vĩ độ/kinh độ). */
export const VIETNAM_BOUNDS = { minLat: 8, maxLat: 24, minLng: 102, maxLng: 110 };
export const HCMC_BOUNDS = { minLat: 10.3, maxLat: 11.2, minLng: 106.3, maxLng: 107.1 };
/** Hai ga cách nhau dưới mức này coi như trùng vị trí (nhập nhầm hoặc tạo trùng). */
export const DUPLICATE_DISTANCE_M = 30;
/** Dưới mức này chỉ cảnh báo: ga quá gần nhau, cần kiểm tra lại. */
export const NEARBY_DISTANCE_M = 200;

const inBounds = (lat: number, lng: number, b: typeof VIETNAM_BOUNDS) =>
  lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const sameName = (a: string, b: string) =>
  a.trim().localeCompare(b.trim(), "vi", { sensitivity: "base" }) === 0;

/** Ga gần nhất (khác ga đang sửa) và khoảng cách tới toạ độ đang nhập (mét). */
export function nearestStation(
  lat: number,
  lng: number,
  all: StationResponse[],
  editingId?: number,
): { station: StationResponse; meters: number } | null {
  let best: { station: StationResponse; meters: number } | null = null;
  for (const station of all) {
    if (station.id === editingId) continue;
    const meters = haversine({ lat, lng }, { lat: station.latitude, lng: station.longitude });
    if (!best || meters < best.meters) best = { station, meters };
  }
  return best;
}

/** Kiểm tra trước khi gửi, theo ràng buộc của backend. Backend vẫn kiểm tra lại (trùng mã → 409). */
export function validateStationDraft(
  draft: StationDraft,
  all: StationResponse[],
  editingId?: number,
): StationErrors {
  const errors: StationErrors = {};
  const code = draft.code.trim();
  if (!code) errors.code = "Vui lòng nhập mã ga";
  else if (code.length > 20) errors.code = "Mã ga tối đa 20 ký tự";
  else if (all.some((s) => s.id !== editingId && s.code.toLowerCase() === code.toLowerCase()))
    errors.code = "Mã ga đã tồn tại";
  else if (!CODE_PATTERN.test(code)) errors.code = CODE_RULE;
  const name = draft.name.trim();
  if (!name) errors.name = "Vui lòng nhập tên ga";
  else if (name.length < 2) errors.name = "Tên ga quá ngắn";
  else if (name.length > 100) errors.name = "Tên ga tối đa 100 ký tự";
  else {
    const dup = all.find((s) => s.id !== editingId && sameName(s.nameStation, name));
    if (dup) errors.name = `Tên ga đã dùng cho ga ${dup.code}`;
  }
  const lat = toNumber(draft.lat);
  const lng = toNumber(draft.lng);
  if (!draft.lat.trim()) errors.lat = "Vui lòng nhập vĩ độ hoặc chọn trên bản đồ";
  else if (!(lat >= -90 && lat <= 90)) errors.lat = "Vĩ độ phải trong khoảng −90 đến 90";
  if (!draft.lng.trim()) errors.lng = "Vui lòng nhập kinh độ hoặc chọn trên bản đồ";
  else if (!(lng >= -180 && lng <= 180)) errors.lng = "Kinh độ phải trong khoảng −180 đến 180";
  if (!errors.lat && !errors.lng) {
    if (!inBounds(lat, lng, VIETNAM_BOUNDS)) {
      errors.lat = "Toạ độ nằm ngoài Việt Nam, kiểm tra lại vĩ độ/kinh độ (có thể bị đảo)";
    } else {
      const near = nearestStation(lat, lng, all, editingId);
      if (near && near.meters < DUPLICATE_DISTANCE_M)
        errors.lat = `Trùng vị trí với ga ${near.station.code} (${near.station.nameStation}, cách ${Math.round(near.meters)} m)`;
    }
  }
  if (draft.address.trim().length > 255) errors.address = "Địa chỉ tối đa 255 ký tự";
  if (draft.district.trim().length > 100) errors.district = "Phường/xã tối đa 100 ký tự";
  const imageUrl = draft.imageUrl.trim();
  if (imageUrl.length > 500) errors.imageUrl = "Đường dẫn ảnh tối đa 500 ký tự";
  else if (imageUrl && !isHttpUrl(imageUrl))
    errors.imageUrl = "Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://";
  return errors;
}

/** Cảnh báo không chặn lưu: dữ liệu hợp lệ nhưng đáng ngờ, admin nên xem lại. */
export function stationWarnings(
  draft: StationDraft,
  all: StationResponse[],
  editingId?: number,
  /** Nhắc ô bỏ trống (chỉ sau khi người dùng bấm lưu, để form mới không hiện nhắc nhở thừa). */
  { includeMissing = true }: { includeMissing?: boolean } = {},
): string[] {
  const warnings: string[] = [];
  const lat = toNumber(draft.lat);
  const lng = toNumber(draft.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && inBounds(lat, lng, VIETNAM_BOUNDS)) {
    if (!inBounds(lat, lng, HCMC_BOUNDS))
      warnings.push("Toạ độ nằm ngoài khu vực TP.HCM và vùng lân cận.");
    const near = nearestStation(lat, lng, all, editingId);
    if (near && near.meters >= DUPLICATE_DISTANCE_M && near.meters < NEARBY_DISTANCE_M)
      warnings.push(
        `Chỉ cách ga ${near.station.code} (${near.station.nameStation}) khoảng ${Math.round(near.meters)} m.`,
      );
  }
  if (includeMissing && !draft.address.trim())
    warnings.push("Chưa có địa chỉ: hành khách sẽ không thấy địa chỉ ga trên app.");
  return warnings;
}

const optional = (value: string) => value.trim() || undefined;

export function buildCreateStationBody(draft: StationDraft) {
  return {
    code: draft.code.trim(),
    nameStation: draft.name.trim(),
    latitude: Number(draft.lat),
    longitude: Number(draft.lng),
    address: optional(draft.address),
    district: optional(draft.district),
    imageUrl: optional(draft.imageUrl),
    isInterchange: draft.interchange,
    status: draft.status,
  };
}

/**
 * Chỉ gửi các field đã đổi. Field tuỳ chọn bị xoá trắng gửi `""` để backend xoá giá trị.
 * Trả về `{}` khi không có gì thay đổi.
 */
export function buildUpdateStationBody(
  draft: StationDraft,
  current: StationResponse,
): UpdateStationBody {
  const body: UpdateStationBody = {};
  const code = draft.code.trim();
  const name = draft.name.trim();
  if (code !== current.code) body.code = code;
  if (name !== current.nameStation) body.nameStation = name;
  if (Number(draft.lat) !== current.latitude) body.latitude = Number(draft.lat);
  if (Number(draft.lng) !== current.longitude) body.longitude = Number(draft.lng);
  for (const [key, field] of [
    ["address", "address"],
    ["district", "district"],
    ["imageUrl", "imageUrl"],
  ] as const) {
    const next = draft[key].trim();
    if (next !== (current[field] ?? "")) body[field] = next;
  }
  if (draft.interchange !== current.isInterchange) body.isInterchange = draft.interchange;
  if (draft.status !== current.status) body.status = draft.status;
  return body;
}

const FIELD_OF: Record<string, keyof StationDraft> = {
  code: "code",
  nameStation: "name",
  latitude: "lat",
  longitude: "lng",
  address: "address",
  district: "district",
  imageUrl: "imageUrl",
  status: "status",
};

/** Lỗi từ backend → lỗi theo ô nhập. Trả về `null` nếu không gắn được vào ô nào (hiện toast). */
export function stationErrorsFromApi(error: unknown): StationErrors | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 409) return { code: error.detail || "Mã ga đã tồn tại" };
  if (error.status !== 400) return null;
  const errors: StationErrors = {};
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    const key = FIELD_OF[field];
    if (key) errors[key] = message;
  }
  return Object.keys(errors).length ? errors : null;
}
