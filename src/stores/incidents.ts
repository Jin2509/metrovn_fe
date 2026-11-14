import { createStore } from "@/lib/store";

// Sự cố tại ga do nhân viên báo từ app. Dữ liệu thật: `incidentsApi` (bảng `incident`).
// Kho này chỉ để trang tổng quan và menu đếm sự cố đang mở mà không phải tự gọi API.

export type IncidentType = "EQUIPMENT" | "SECURITY" | "MEDICAL" | "PASSENGER" | "OTHER";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
/** NEW → IN_PROGRESS (nhận xử lý) → RESOLVED. */
export type IncidentStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

export type StationIncident = {
  id: string;
  stationId: string;
  stationName: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  /** Mã tài khoản (UUID) của nhân viên báo. */
  reportedBy: string;
  description: string;
  hasImage: boolean;
  handledBy: string | null;
  resolution: string | null;
  acceptedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export const incidentsStore = createStore<StationIncident[]>([]);
