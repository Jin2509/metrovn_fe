import {
  ApiError,
  type StationApiStatus,
  type StationResponse,
  type UpdateStationBody,
} from "@/lib/api";
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
  const name = draft.name.trim();
  if (!name) errors.name = "Vui lòng nhập tên ga";
  else if (name.length > 100) errors.name = "Tên ga tối đa 100 ký tự";
  const lat = toNumber(draft.lat);
  const lng = toNumber(draft.lng);
  if (!(lat >= -90 && lat <= 90)) errors.lat = "Vĩ độ phải trong khoảng −90 đến 90";
  if (!(lng >= -180 && lng <= 180)) errors.lng = "Kinh độ phải trong khoảng −180 đến 180";
  if (draft.address.trim().length > 255) errors.address = "Địa chỉ tối đa 255 ký tự";
  if (draft.district.trim().length > 100) errors.district = "Quận/huyện tối đa 100 ký tự";
  if (draft.imageUrl.trim().length > 500) errors.imageUrl = "Đường dẫn ảnh tối đa 500 ký tự";
  return errors;
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
