import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type {
  AnnouncementApiStatus,
  AnnouncementResponse,
  CampaignBody,
  CampaignListQuery,
  CampaignPreview,
  CampaignResponse,
  CampaignStats,
  CreateAnnouncementBody,
  Page,
  UpdateAnnouncementBody,
} from "./types";

// Thông báo vận hành (hiện trong app theo tuyến/ga). Luồng: DRAFT → submit → approve/reject.
// Tạo/sửa/gửi duyệt cần ANNOUNCEMENT_MANAGE; duyệt/từ chối cần ANNOUNCEMENT_APPROVE.
const announcement = (id: number, action?: string) =>
  `${V1}/announcements/${seg(id)}${action ? `/${action}` : ""}`;

export const announcementsApi = {
  list: (status?: AnnouncementApiStatus) =>
    apiRequest<AnnouncementResponse[]>(`${V1}/announcements`, { query: { status } }),
  byLine: (lineId: number) =>
    apiRequest<AnnouncementResponse[]>(`${V1}/lines/${seg(lineId)}/announcements`),
  byStation: (stationId: number) =>
    apiRequest<AnnouncementResponse[]>(`${V1}/stations/${seg(stationId)}/announcements`),
  get: (id: number) => apiRequest<AnnouncementResponse>(announcement(id)),
  create: (body: CreateAnnouncementBody) =>
    apiRequest<AnnouncementResponse>(`${V1}/announcements`, { method: "POST", body }),
  update: (id: number, body: UpdateAnnouncementBody) =>
    apiRequest<AnnouncementResponse>(announcement(id), { method: "PUT", body }),
  submit: (id: number) =>
    apiRequest<AnnouncementResponse>(announcement(id, "submit"), { method: "POST" }),
  /** Duyệt xong backend tự tạo chiến dịch gửi thông báo (`source = ANNOUNCEMENT`). */
  approve: (id: number) =>
    apiRequest<AnnouncementResponse>(announcement(id, "approve"), { method: "POST" }),
  reject: (id: number, reason: string) =>
    apiRequest<AnnouncementResponse>(announcement(id, "reject"), {
      method: "POST",
      body: { reason },
    }),
};

// Chiến dịch thông báo (push/email/trong app). Xem cần NOTIFICATION_MANAGE hoặc REPORT_VIEW,
// thay đổi cần NOTIFICATION_MANAGE. Mọi thao tác ghi gửi kèm `version` để chống ghi đè.
const CAMPAIGNS = `${V1}/admin/notification-campaigns`;
const campaign = (id: string, action?: string) =>
  `${CAMPAIGNS}/${seg(id)}${action ? `/${action}` : ""}`;

export const campaignsApi = {
  list: (query: CampaignListQuery = {}) => apiRequest<Page<CampaignResponse>>(CAMPAIGNS, { query }),
  get: (id: string) => apiRequest<CampaignResponse>(campaign(id)),
  stats: (id: string) => apiRequest<CampaignStats>(campaign(id, "stats")),
  /** Số người nhận dự kiến trước khi gửi. */
  preview: (id: string) => apiRequest<CampaignPreview>(campaign(id, "preview")),
  /** Tạo bản nháp. */
  create: (body: CampaignBody) => apiRequest<CampaignResponse>(CAMPAIGNS, { method: "POST", body }),
  update: (id: string, version: number, body: CampaignBody) =>
    apiRequest<CampaignResponse>(campaign(id), {
      method: "PUT",
      body: { version, campaign: body },
    }),
  /** `scheduledAt` bỏ trống: gửi ngay; có giá trị: hẹn giờ (SCHEDULED). */
  send: (id: string, version: number, scheduledAt?: string) =>
    apiRequest<CampaignResponse>(campaign(id, "send"), {
      method: "POST",
      body: { version, scheduledAt },
    }),
  cancel: (id: string, version: number) =>
    apiRequest<CampaignResponse>(campaign(id, "cancel"), { method: "POST", body: { version } }),
  remove: (id: string) => apiRequest(campaign(id), { method: "DELETE" }),
};
