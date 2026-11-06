// Kiểu dữ liệu theo tài liệu API backend. Client bỏ qua các field lạ trong response.

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "LOCKED";

export type MeResponse = {
  id: string;
  email: string;
  fullName: string;
  status: AccountStatus;
  roles: string[];
  permissions: string[];
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  status: AccountStatus;
  roles: string[];
  createdAt: string;
};

export type Page<T> = {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};

export type UserListQuery = {
  q?: string;
  status?: AccountStatus;
  /** Bắt đầu từ 0. */
  page?: number;
  /** Tối đa 100. */
  size?: number;
  /** `email`, `fullName`, `status` hoặc `createdAt`, kèm `,asc` hoặc `,desc`. */
  sort?: string;
};

/** Backend có thể thêm mã mới, nên `AuditLog.type` vẫn là string. */
export type AuthEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "TOKEN_REUSE_DETECTED"
  | "EMAIL_VERIFIED"
  | "EMAIL_CHANGED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "ACCOUNT_CREATED_BY_ADMIN"
  | "PASSWORD_RESET_BY_ADMIN"
  | "ROLES_CHANGED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_ACTIVATED";

export type AccountRef = { id: string; email: string; fullName: string };

export type AuditLog = {
  id: string;
  type: string;
  user: AccountRef | null;
  /** null: chính chủ thực hiện, hoặc tài khoản admin đó đã bị xoá. */
  actor: AccountRef | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AuditLogQuery = {
  q?: string;
  type?: AuthEventType;
  /** ISO-8601. Lấy từ `from` đến trước `to`. */
  from?: string;
  to?: string;
  /** Bắt đầu từ 0. */
  page?: number;
  /** Tối đa 100. */
  size?: number;
};

export type NotificationItem = {
  id: string;
  /** SYSTEM, SECURITY, ANNOUNCEMENT. Backend có thể thêm mã mới. */
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListQuery = {
  /** Bắt đầu từ 0. */
  page?: number;
  /** Tối đa 100. */
  size?: number;
};

/** Chọn đúng một trong hai: `all` hoặc `userIds` (tối đa 1000). */
export type SendNotificationBody = { title: string; body: string } & (
  { all: true } | { userIds: string[] }
);

export type RoleResponse = {
  code: string;
  name: string;
  system: boolean;
  permissions: string[];
};

export type PermissionResponse = {
  code: string;
  description: string;
};

// ---- Tuyến, ga, chuyển tuyến (/api/v1) ----
// Toạ độ và khoảng cách là BigDecimal ở backend, JSON trả về dạng số.

export type LineStatus = "ACTIVE" | "INACTIVE" | "UNDER_CONSTRUCTION";
export type StationApiStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type TransferStatus = "ACTIVE" | "INACTIVE";

export type LineResponse = {
  id: number;
  code: string;
  nameLine: string;
  colorHex: string | null;
  description: string | null;
  status: LineStatus;
  createdAt: string;
  updatedAt: string;
};

export type StationResponse = {
  id: number;
  code: string;
  nameStation: string;
  latitude: number;
  longitude: number;
  address: string | null;
  district: string | null;
  imageUrl: string | null;
  isInterchange: boolean;
  status: StationApiStatus;
  createdAt: string;
  updatedAt: string;
};

export type LineStationResponse = {
  id: number;
  lineId: number;
  lineCode: string;
  lineName: string;
  station: StationResponse;
  /** Luôn liên tục 1..n. */
  stationOrder: number;
  /** Đoạn từ ga liền trước tới ga này; ga đầu tuyến luôn là 0. */
  distanceFromPrevKm: number;
  travelTimeFromPrevSeconds: number;
  dwellTimeSeconds: number;
  createdAt: string;
};

export type LineTransferResponse = {
  id: number;
  stationId: number;
  fromLineId: number;
  toLineId: number;
  transferTimeMinutes: number;
  status: TransferStatus;
  createdAt: string;
  updatedAt: string;
};

export type LineListQuery = {
  code?: string;
  name?: string;
  status?: LineStatus;
  page?: number;
  size?: number;
  /** Chỉ: id, code, nameLine, status, createdAt, updatedAt. */
  sort?: string;
};

export type StationListQuery = {
  q?: string;
  /** Có `lineId` thì kết quả luôn theo thứ tự ga trên tuyến, `sort` bị bỏ qua. */
  lineId?: number;
  status?: StationApiStatus;
  page?: number;
  size?: number;
  /** Chỉ: id, code, nameStation, district, status, createdAt, updatedAt. */
  sort?: string;
};

export type CreateLineBody = {
  code: string;
  nameLine: string;
  colorHex?: string;
  description?: string;
  status?: LineStatus;
};
/** Bỏ field / null: giữ nguyên. `""` ở colorHex, description: xoá giá trị. */
export type UpdateLineBody = Partial<CreateLineBody>;

export type CreateStationBody = {
  code: string;
  nameStation: string;
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  imageUrl?: string;
  isInterchange?: boolean;
  status?: StationApiStatus;
};
/** Bỏ field / null: giữ nguyên. `""` ở address, district, imageUrl: xoá giá trị. */
export type UpdateStationBody = Partial<CreateStationBody>;

export type AddLineStationBody = {
  stationId: number;
  /** Bỏ trống hoặc lớn hơn số ga: thêm vào cuối tuyến. */
  stationOrder?: number;
  /** Bỏ trống: backend tự tính đường chim bay. */
  distanceFromPrevKm?: number;
  /** Bỏ trống: backend ước lượng 60 giây/km. */
  travelTimeFromPrevSeconds?: number;
  dwellTimeSeconds?: number;
};

export type UpdateSegmentBody = {
  distanceFromPrevKm?: number;
  travelTimeFromPrevSeconds?: number;
  dwellTimeSeconds?: number;
};

export type StationOrderItem = { stationId: number; stationOrder: number };

export type CreateTransferBody = {
  stationId: number;
  fromLineId: number;
  toLineId: number;
  transferTimeMinutes?: number;
  status?: TransferStatus;
};
export type UpdateTransferBody = Partial<CreateTransferBody>;
