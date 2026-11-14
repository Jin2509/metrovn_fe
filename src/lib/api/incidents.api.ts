import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type { IncidentListQuery, IncidentResponse, Page } from "./types";

// Sự cố do nhân viên ga báo từ app (INCIDENT_REPORT). Web xử lý: cần INCIDENT_MANAGE.
export const incidentsApi = {
  list: (query: IncidentListQuery = {}) =>
    apiRequest<Page<IncidentResponse>>(`${V1}/incidents`, { query }),
  /** NEW → IN_PROGRESS, ghi nhận người xử lý. */
  accept: (id: number) =>
    apiRequest<IncidentResponse>(`${V1}/incidents/${seg(id)}/accept`, { method: "POST" }),
  resolve: (id: number, resolution: string) =>
    apiRequest<IncidentResponse>(`${V1}/incidents/${seg(id)}/resolve`, {
      method: "POST",
      body: { resolution },
    }),
  /** Ảnh đính kèm (khi `hasImage`). Dùng `URL.createObjectURL` để hiển thị. */
  image: (id: number) =>
    apiRequest<Blob>(`${V1}/incidents/${seg(id)}/image`, { responseType: "blob" }),
};
