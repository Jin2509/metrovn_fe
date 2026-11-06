import { apiRequest } from "./client";
import type {
  AddLineStationBody,
  CreateLineBody,
  CreateStationBody,
  CreateTransferBody,
  LineListQuery,
  LineResponse,
  LineStationResponse,
  LineTransferResponse,
  Page,
  StationListQuery,
  StationOrderItem,
  StationResponse,
  UpdateLineBody,
  UpdateSegmentBody,
  UpdateStationBody,
  UpdateTransferBody,
} from "./types";

// Tuyến, ga, chuyển tuyến. GET cần đăng nhập; POST/PUT/DELETE cần quyền STATION_MANAGE.
const V1 = "/api/v1";
const id = (value: number | string) => encodeURIComponent(String(value));

export const linesApi = {
  list: (query: LineListQuery = {}) => apiRequest<Page<LineResponse>>(`${V1}/lines`, { query }),
  /** Không phân trang, dùng cho dropdown. */
  all: () => apiRequest<LineResponse[]>(`${V1}/lines/all`),
  get: (lineId: number) => apiRequest<LineResponse>(`${V1}/lines/${id(lineId)}`),
  create: (body: CreateLineBody) =>
    apiRequest<LineResponse>(`${V1}/lines`, { method: "POST", body }),
  update: (lineId: number, body: UpdateLineBody) =>
    apiRequest<LineResponse>(`${V1}/lines/${id(lineId)}`, { method: "PUT", body }),
  /** Xoá luôn danh sách ga của tuyến, điểm chuyển tuyến và cấu hình vận hành (bản ghi ga vẫn còn). */
  remove: (lineId: number) => apiRequest(`${V1}/lines/${id(lineId)}`, { method: "DELETE" }),

  /** Các ga trên tuyến theo `stationOrder`. */
  stations: (lineId: number) =>
    apiRequest<LineStationResponse[]>(`${V1}/lines/${id(lineId)}/stations`),
  addStation: (lineId: number, body: AddLineStationBody) =>
    apiRequest<LineStationResponse>(`${V1}/lines/${id(lineId)}/stations`, {
      method: "POST",
      body,
    }),
  updateSegment: (lineId: number, stationId: number, body: UpdateSegmentBody) =>
    apiRequest<LineStationResponse>(`${V1}/lines/${id(lineId)}/stations/${id(stationId)}/segment`, {
      method: "PUT",
      body,
    }),
  /** Phải gửi đủ mọi ga đang có trên tuyến, mỗi ga một lần. */
  reorder: (lineId: number, items: StationOrderItem[]) =>
    apiRequest<LineStationResponse[]>(`${V1}/lines/${id(lineId)}/stations/order`, {
      method: "PUT",
      body: items,
    }),
  removeStation: (lineId: number, stationId: number) =>
    apiRequest(`${V1}/lines/${id(lineId)}/stations/${id(stationId)}`, { method: "DELETE" }),
  transfers: (lineId: number) =>
    apiRequest<LineTransferResponse[]>(`${V1}/lines/${id(lineId)}/transfers`),
};

/** Không cần đăng nhập (bản đồ tuyến công khai). */
export const publicLinesApi = {
  stations: (lineCode: string) =>
    apiRequest<LineStationResponse[]>(`${V1}/public/lines/${id(lineCode)}/stations`, {
      auth: false,
    }),
};

export const stationsApi = {
  list: (query: StationListQuery = {}) =>
    apiRequest<Page<StationResponse>>(`${V1}/stations`, { query }),
  all: () => apiRequest<StationResponse[]>(`${V1}/stations/all`),
  /** Gần → xa. `radiusKm` mặc định 5. */
  nearest: (lat: number, lng: number, radiusKm?: number) =>
    apiRequest<StationResponse[]>(`${V1}/stations/nearest`, { query: { lat, lng, radiusKm } }),
  get: (stationId: number) => apiRequest<StationResponse>(`${V1}/stations/${id(stationId)}`),
  lines: (stationId: number) => apiRequest<LineResponse[]>(`${V1}/stations/${id(stationId)}/lines`),
  connections: (stationId: number) =>
    apiRequest<LineTransferResponse[]>(`${V1}/stations/${id(stationId)}/connections`),
  create: (body: CreateStationBody) =>
    apiRequest<StationResponse>(`${V1}/stations`, { method: "POST", body }),
  update: (stationId: number, body: UpdateStationBody) =>
    apiRequest<StationResponse>(`${V1}/stations/${id(stationId)}`, { method: "PUT", body }),
  /** 409 khi ga còn thuộc một tuyến bất kỳ. */
  remove: (stationId: number) =>
    apiRequest(`${V1}/stations/${id(stationId)}`, { method: "DELETE" }),
};

export const lineTransfersApi = {
  all: () => apiRequest<LineTransferResponse[]>(`${V1}/line-transfers`),
  get: (transferId: number) =>
    apiRequest<LineTransferResponse>(`${V1}/line-transfers/${id(transferId)}`),
  /** Ga phải nằm trên cả hai tuyến. Có hướng: muốn đi hai chiều thì tạo hai bản ghi. */
  create: (body: CreateTransferBody) =>
    apiRequest<LineTransferResponse>(`${V1}/line-transfers`, { method: "POST", body }),
  update: (transferId: number, body: UpdateTransferBody) =>
    apiRequest<LineTransferResponse>(`${V1}/line-transfers/${id(transferId)}`, {
      method: "PUT",
      body,
    }),
  remove: (transferId: number) =>
    apiRequest(`${V1}/line-transfers/${id(transferId)}`, { method: "DELETE" }),
};
