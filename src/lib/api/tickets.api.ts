import { apiRequest } from "./client";
import { V1, seg } from "./path";
import type {
  AdminTicketQuery,
  CreateTicketProductBody,
  FareConfig,
  FareQuote,
  Page,
  PageQuery,
  PublicTicketProduct,
  SystemParamResponse,
  TicketPriceResponse,
  TicketPriceStatus,
  TicketProductAudit,
  TicketProductResponse,
  TicketResponse,
  TicketValidation,
  UpdateTicketProductBody,
} from "./types";

// Loại vé. Xem cần đăng nhập; thay đổi cần FARE_MANAGE.
const product = (id: number, action?: string) =>
  `${V1}/ticket-products/${seg(id)}${action ? `/${action}` : ""}`;

export const ticketProductsApi = {
  /** Loại vé đang bán, không cần đăng nhập. */
  publicList: () =>
    apiRequest<PublicTicketProduct[]>(`${V1}/public/ticket-products`, { auth: false }),
  all: () => apiRequest<TicketProductResponse[]>(`${V1}/ticket-products`),
  get: (id: number) => apiRequest<TicketProductResponse>(product(id)),
  history: (id: number) => apiRequest<TicketProductAudit[]>(product(id, "history")),
  create: (body: CreateTicketProductBody) =>
    apiRequest<TicketProductResponse>(`${V1}/ticket-products`, { method: "POST", body }),
  /** 409 khi `version` đã cũ (người khác vừa sửa). */
  update: (id: number, body: UpdateTicketProductBody) =>
    apiRequest<TicketProductResponse>(product(id), { method: "PUT", body }),
  activate: (id: number) =>
    apiRequest<TicketProductResponse>(product(id, "activate"), { method: "POST" }),
  deactivate: (id: number) =>
    apiRequest<TicketProductResponse>(product(id, "deactivate"), { method: "POST" }),
  /** Chỉ xoá được loại vé chưa bán (`hasSoldTickets = false`). */
  remove: (id: number) => apiRequest(product(id), { method: "DELETE" }),
};

// Bảng giá vé có duyệt: lập cần FARE_MANAGE, duyệt/từ chối cần FARE_APPROVE.
export const ticketPricesApi = {
  /** Đề xuất giá mới cho loại vé, chờ duyệt. */
  /** `effectiveFrom` là Instant ISO, không được ở quá khứ. */
  submit: (productId: number, body: { priceVnd: number; effectiveFrom: string }) =>
    apiRequest<TicketPriceResponse>(`${V1}/ticket-products/${seg(productId)}/prices`, {
      method: "POST",
      body,
    }),
  list: (query: PageQuery & { status?: TicketPriceStatus } = {}) =>
    apiRequest<Page<TicketPriceResponse>>(`${V1}/ticket-prices`, { query }),
  approve: (id: number) =>
    apiRequest<TicketPriceResponse>(`${V1}/ticket-prices/${seg(id)}/approve`, { method: "POST" }),
  reject: (id: number, reason: string) =>
    apiRequest<TicketPriceResponse>(`${V1}/ticket-prices/${seg(id)}/reject`, {
      method: "POST",
      body: { reason },
    }),
};

// Giá vé lượt theo km. Xem công khai; đổi đơn giá cần FARE_MANAGE hoặc SYSTEM_PARAM_MANAGE.
export const faresApi = {
  /** Đơn giá/km của các loại vé lượt đang bán. */
  list: () => apiRequest<FareConfig[]>(`${V1}/public/fares`, { auth: false }),
  /** `productCode` bỏ trống: loại vé lượt mặc định (SINGLE). */
  quote: (fromStationId: number, toStationId: number, productCode?: string) =>
    apiRequest<FareQuote>(`${V1}/public/fares/quote`, {
      auth: false,
      query: { fromStationId, toStationId, productCode },
    }),
  /** Lưu thành phiên bản mới của tham số FARE_PER_KM_<mã>; `effectiveFrom` bỏ trống: áp dụng ngay. */
  updatePerKm: (productCode: string, farePerKmVnd: number, effectiveFrom?: string) =>
    apiRequest<SystemParamResponse>(`${V1}/fares/${seg(productCode)}/per-km`, {
      method: "PUT",
      body: { farePerKmVnd, effectiveFrom },
    }),
};

// Tra cứu vé đã bán: cần TICKET_VIEW_ALL. Mặc định mới mua trước.
export const ticketsApi = {
  search: (query: AdminTicketQuery = {}) =>
    apiRequest<Page<TicketResponse>>(`${V1}/admin/tickets`, { query }),
  get: (ticketId: string) => apiRequest<TicketResponse>(`${V1}/tickets/${seg(ticketId)}`),
  /** Lịch sử quẹt vé tại cổng. */
  validations: (ticketId: string) =>
    apiRequest<TicketValidation[]>(`${V1}/tickets/${seg(ticketId)}/validations`),
};
