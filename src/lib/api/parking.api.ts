import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type {
  CreateParkingLotBody,
  Page,
  ParkingLotResponse,
  ParkingSession,
  ParkingSessionQuery,
  UpdateParkingLotBody,
  UpsertParkingRateBody,
  VehicleType,
} from "./types";

// Bãi gửi xe. Danh sách công khai; thay đổi cần PARKING_MANAGE.
const lot = (lotId: number) => `${V1}/parking-lots/${seg(lotId)}`;

export const parkingLotsApi = {
  /** Kèm sức chứa, số chỗ trống và giá theo loại xe. */
  list: (stationId?: number) =>
    apiRequest<ParkingLotResponse[]>(`${V1}/public/parking-lots`, {
      auth: false,
      query: { stationId },
    }),
  get: (lotId: number) =>
    apiRequest<ParkingLotResponse>(`${V1}/public/parking-lots/${seg(lotId)}`, { auth: false }),
  create: (body: CreateParkingLotBody) =>
    apiRequest<ParkingLotResponse>(`${V1}/parking-lots`, { method: "POST", body }),
  update: (lotId: number, body: UpdateParkingLotBody) =>
    apiRequest<ParkingLotResponse>(lot(lotId), { method: "PUT", body }),
  /** Tạo hoặc sửa sức chứa và giá của một loại xe. */
  upsertRate: (lotId: number, vehicleType: VehicleType, body: UpsertParkingRateBody) =>
    apiRequest<ParkingLotResponse>(`${lot(lotId)}/rates/${seg(vehicleType)}`, {
      method: "PUT",
      body,
    }),
  /** Cần PARKING_OPERATE hoặc PARKING_MANAGE. */
  sessions: (lotId: number, query: ParkingSessionQuery = {}) =>
    apiRequest<Page<ParkingSession>>(`${lot(lotId)}/sessions`, { query }),
};
