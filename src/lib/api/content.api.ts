import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type {
  ActionLog,
  ActionLogQuery,
  BannerResponse,
  ChatFaqBody,
  ChatFaqResponse,
  CreateBannerInput,
  GreenLeaderboard,
  GreenPublicStats,
  GreenSettings,
  MembershipTier,
  Page,
  PageQuery,
  SystemParamResponse,
  UpdateGreenSettingsBody,
  UpdateSystemParamBody,
} from "./types";

const ADMIN = `${V1}/admin`;

// Kho câu hỏi thường gặp của chatbot: cần CHATBOT_MANAGE.
// Backend chưa có API phiên/tin nhắn cho quản trị (chỉ có cho chính hành khách).
export const chatbotFaqsApi = {
  list: (query: PageQuery = {}) =>
    apiRequest<Page<ChatFaqResponse>>(`${ADMIN}/chatbot/faqs`, { query }),
  create: (body: ChatFaqBody) =>
    apiRequest<ChatFaqResponse>(`${ADMIN}/chatbot/faqs`, { method: "POST", body }),
  update: (id: number, body: ChatFaqBody) =>
    apiRequest<ChatFaqResponse>(`${ADMIN}/chatbot/faqs/${seg(id)}`, { method: "PUT", body }),
  remove: (id: number) => apiRequest(`${ADMIN}/chatbot/faqs/${seg(id)}`, { method: "DELETE" }),
};

export const greenJourneyApi = {
  /** Cần GREEN_JOURNEY_MANAGE hoặc REPORT_VIEW. */
  settings: () => apiRequest<GreenSettings>(`${ADMIN}/green-journey/settings`),
  /** Cần GREEN_JOURNEY_MANAGE. 409 khi `version` đã cũ. */
  updateSettings: (body: UpdateGreenSettingsBody) =>
    apiRequest<GreenSettings>(`${ADMIN}/green-journey/settings`, { method: "PUT", body }),
  publicStats: () =>
    apiRequest<GreenPublicStats>(`${V1}/public/green-journey/stats`, { auth: false }),
  /** `month` dạng yyyy-MM, bỏ trống: tháng hiện tại. */
  leaderboard: (month?: string, limit?: number) =>
    apiRequest<GreenLeaderboard>(`${V1}/green-journey/leaderboard`, { query: { month, limit } }),
};

// Hạng thành viên CPoint: cần SYSTEM_PARAM_MANAGE. Số điểm mỗi lần check-in là tham số hệ thống.
export const membershipTiersApi = {
  list: () => apiRequest<MembershipTier[]>(`${ADMIN}/membership-tiers`),
  update: (code: string, body: { name: string; minPoints: number }) =>
    apiRequest<MembershipTier>(`${ADMIN}/membership-tiers/${seg(code)}`, { method: "PUT", body }),
};

// Tham số hệ thống: cần SYSTEM_PARAM_MANAGE. Mỗi lần sửa tạo một phiên bản mới có hiệu lực từ `effectiveFrom`.
export const systemParamsApi = {
  /** Giá trị đang/sắp áp dụng của mỗi tham số. */
  list: () => apiRequest<SystemParamResponse[]>(`${ADMIN}/system-params`),
  history: (key: string) =>
    apiRequest<SystemParamResponse[]>(`${ADMIN}/system-params/${seg(key)}/history`),
  update: (key: string, body: UpdateSystemParamBody) =>
    apiRequest<SystemParamResponse>(`${ADMIN}/system-params/${seg(key)}`, { method: "PUT", body }),
};

// Nhật ký thao tác nghiệp vụ: cần AUDIT_VIEW. Mới nhất trước, mặc định 50 dòng/trang.
export const actionLogsApi = {
  list: (query: ActionLogQuery = {}) =>
    apiRequest<Page<ActionLog>>(`${ADMIN}/audit-logs`, { query }),
};

// Banner trên app (/api/content/banners). Thêm/xoá cần CONTENT_MANAGE.
export const bannersApi = {
  list: () => apiRequest<BannerResponse[]>("/api/content/banners"),
  /** `imagePath` của banner trỏ tới đây. */
  image: (id: string) =>
    apiRequest<Blob>(`/api/content/banners/${seg(id)}/image`, { responseType: "blob" }),
  create: ({ image, title, subtitle, linkPath, position }: CreateBannerInput) => {
    const form = new FormData();
    form.append("image", image);
    form.append("title", title);
    if (subtitle) form.append("subtitle", subtitle);
    if (linkPath) form.append("linkPath", linkPath);
    if (position !== undefined) form.append("position", String(position));
    return apiRequest<BannerResponse>("/api/content/banners", { method: "POST", body: form });
  },
  remove: (id: string) => apiRequest(`/api/content/banners/${seg(id)}`, { method: "DELETE" }),
};
