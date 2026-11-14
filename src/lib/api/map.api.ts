import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type {
  BusRoute,
  BusStop,
  Journey,
  NetworkResponse,
  RouteOptimize,
  StaffAssignment,
} from "./types";

/** Không cần đăng nhập. */
export const mapApi = {
  /** Toàn mạng lưới: tuyến kèm ga theo thứ tự, ga, điểm chuyển tuyến. */
  network: () => apiRequest<NetworkResponse>(`${V1}/public/map/network`, { auth: false }),
  route: (fromStationId: number, toStationId: number, optimize?: RouteOptimize) =>
    apiRequest<Journey>(`${V1}/public/map/route`, {
      auth: false,
      query: { fromStationId, toStationId, optimize },
    }),
};

// Xe buýt lấy từ hệ thống bên ngoài. `radiusKm` 0.1..5 (mặc định 1), `limit` 1..50 (mặc định 10).
export const busApi = {
  routes: () => apiRequest<BusRoute[]>(`${V1}/bus/routes`),
  nearby: (lat: number, lng: number, radiusKm?: number, limit?: number) =>
    apiRequest<BusStop[]>(`${V1}/bus/stops/nearby`, { query: { lat, lng, radiusKm, limit } }),
  forStation: (stationId: number, radiusKm?: number, limit?: number) =>
    apiRequest<BusStop[]>(`${V1}/stations/${seg(stationId)}/bus`, { query: { radiusKm, limit } }),
};

// Phân công nhân viên ga: cần STATION_MANAGE.
export const staffAssignmentsApi = {
  byStation: (stationId: number) =>
    apiRequest<StaffAssignment[]>(`${V1}/stations/${seg(stationId)}/staff`),
  assign: (stationId: number, userId: string) =>
    apiRequest<StaffAssignment>(`${V1}/stations/${seg(stationId)}/staff`, {
      method: "POST",
      body: { userId },
    }),
  unassign: (stationId: number, userId: string) =>
    apiRequest(`${V1}/stations/${seg(stationId)}/staff/${seg(userId)}`, { method: "DELETE" }),
};
