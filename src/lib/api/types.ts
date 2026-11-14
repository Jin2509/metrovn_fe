// Kiểu dữ liệu theo tài liệu API backend. Client bỏ qua các field lạ trong response.

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

/** Tài khoản bật xác thực 2 bước: login trả về ticket, gửi kèm mã OTP tới `/api/auth/login/2fa`. */
export type TwoFactorChallengeResponse = {
  twoFactorRequired: true;
  ticket: string;
  expiresAt: string;
};

export type LoginResponse = TokenResponse | TwoFactorChallengeResponse;

export const isTwoFactorChallenge = (r: LoginResponse): r is TwoFactorChallengeResponse =>
  "twoFactorRequired" in r && r.twoFactorRequired === true;

export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "LOCKED";

export type MeResponse = {
  id: string;
  email: string;
  fullName: string;
  status: AccountStatus;
  roles: string[];
  permissions: string[];
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
  twoFactorEnabled?: boolean;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  status: AccountStatus;
  roles: string[];
  createdAt: string;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
};

/** Phân trang kiểu Spring: `page` bắt đầu từ 0, `sort` dạng `field,asc|desc`. */
export type PageQuery = { page?: number; size?: number; sort?: string };

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
  | "ACCOUNT_ACTIVATED"
  | "TWO_FACTOR_ENABLED"
  | "TWO_FACTOR_DISABLED"
  | "TWO_FACTOR_FAILED";

/** Lịch sử bảo mật của chính mình (`GET /api/me/auth-events`). */
export type MyAuthEvent = {
  type: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

/** Lịch sử bảo mật của một tài khoản (`GET /api/admin/users/{id}/auth-events`). */
export type UserAuthEvent = MyAuthEvent & { actorId: string | null };

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

export type NotificationType =
  | "SYSTEM"
  | "SECURITY"
  | "ANNOUNCEMENT"
  | "TICKET"
  | "PAYMENT"
  | "PARKING"
  | "STUDENT"
  | "GREEN_JOURNEY"
  | "PROMOTION";
export type NotificationPriority = "NORMAL" | "HIGH";

export type NotificationItem = {
  id: string;
  /** Xem `NotificationType`. Backend có thể thêm mã mới. */
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  priority?: NotificationPriority;
  /** Màn hình trong app, bắt đầu bằng "/". */
  link?: string | null;
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

// ---- Quy ước cho các phần bên dưới ----
// Instant → chuỗi ISO-8601 (UTC). LocalDate → "yyyy-MM-dd". LocalTime → "HH:mm:ss" (gửi lên có thể "HH:mm").
// UUID → string. Long/BigDecimal → number. Tiền luôn là VND, số nguyên.

// ---- Đoàn tàu, cấu hình vận hành (/api/v1) ----
// GET cần đăng nhập; tàu cần TRAIN_MANAGE, cấu hình cần OPERATION_MANAGE / OPERATION_APPROVE.

export type TrainStatus = "READY" | "IN_OPERATION" | "MAINTENANCE" | "OUT_OF_SERVICE";

export type TrainResponse = {
  id: number;
  code: string;
  nameTrain: string | null;
  lineId: number | null;
  lineCode: string | null;
  lineName: string | null;
  capacity: number | null;
  manufactureYear: number | null;
  status: TrainStatus;
  createdAt: string;
  updatedAt: string;
};

export type TrainListQuery = PageQuery & { lineId?: number; status?: TrainStatus };

export type CreateTrainBody = {
  code: string;
  nameTrain?: string;
  lineId?: number;
  /** 1..5000 */
  capacity?: number;
  /** 1901..2100 */
  manufactureYear?: number;
  status?: TrainStatus;
};
/** Bỏ field: giữ nguyên. Đổi `status` phải theo luồng trạng thái hợp lệ của backend. */
export type UpdateTrainBody = Partial<CreateTrainBody>;

/** DRAFT → PENDING_APPROVAL → APPROVED | REJECTED → ACTIVE → INACTIVE. */
export type OperationConfigStatus =
  "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";

export type OperationConfigResponse = {
  id: number;
  lineId: number;
  version: number;
  numberOfTrains: number;
  headwayMinutes: number;
  runningTimeMinutes: number;
  turnaroundTimeMinutes: number | null;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: OperationConfigStatus;
  createdBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateOperationConfigBody = {
  numberOfTrains: number;
  headwayMinutes: number;
  runningTimeMinutes: number;
  turnaroundTimeMinutes?: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo?: string;
};
/** Bỏ field: giữ nguyên. `clearEffectiveTo: true` để bỏ ngày hết hiệu lực. */
export type UpdateOperationConfigBody = Partial<CreateOperationConfigBody> & {
  clearEffectiveTo?: boolean;
};

// ---- Bản đồ, tìm đường, xe buýt (/api/v1) ----

export type MapLineStop = {
  stationId: number;
  stationCode: string;
  stationName: string;
  order: number;
  latitude: number;
  longitude: number;
  status: StationApiStatus;
  distanceFromPrevKm: number;
  travelTimeFromPrevSeconds: number;
  dwellTimeSeconds: number;
  cumulativeDistanceKm: number;
  cumulativeTimeSeconds: number;
};

export type MapLine = {
  id: number;
  code: string;
  name: string;
  colorHex: string | null;
  status: LineStatus;
  stationCount: number;
  totalDistanceKm: number;
  endToEndTimeSeconds: number;
  stops: MapLineStop[];
};

export type MapStation = {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  status: StationApiStatus;
  interchange: boolean;
  district: string | null;
  lineCodes: string[];
};

export type MapTransfer = {
  stationId: number;
  stationCode: string;
  fromLineId: number;
  fromLineCode: string;
  toLineId: number;
  toLineCode: string;
  transferTimeMinutes: number;
  status: TransferStatus;
};

export type NetworkResponse = {
  lines: MapLine[];
  stations: MapStation[];
  transfers: MapTransfer[];
};

export type RouteOptimize = "FASTEST" | "SHORTEST";
export type RouteStationRef = {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
};
export type JourneyLeg = {
  lineId: number;
  lineCode: string;
  lineName: string;
  colorHex: string | null;
  from: RouteStationRef;
  to: RouteStationRef;
  headsign: RouteStationRef;
  stops: RouteStationRef[];
  distanceKm: number;
  durationSeconds: number;
};
export type JourneyTransfer = {
  station: RouteStationRef;
  fromLineCode: string;
  toLineCode: string;
  minutes: number;
};
export type Journey = {
  from: RouteStationRef;
  to: RouteStationRef;
  optimize: RouteOptimize;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  rideDurationSeconds: number;
  transferDurationSeconds: number;
  legs: JourneyLeg[];
  transfers: JourneyTransfer[];
};

/** Dữ liệu lấy từ hệ thống giao thông bên ngoài. */
export type BusRoute = { code: string; name: string; description: string | null };
export type BusStop = {
  stopId: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
  routeCode: string | null;
  routeName: string | null;
  arrivalMinutes: number | null;
};

// ---- Phân công nhân viên ga (/api/v1, cần STATION_MANAGE) ----

export type StaffAssignment = {
  id: number;
  userId: string;
  email: string;
  fullName: string;
  stationId: number;
  stationCode: string;
  stationName: string;
  assignedAt: string;
};

// ---- Loại vé, giá vé, vé (/api/v1) ----

export type DurationUnit = "DAY" | "WEEK" | "MONTH";
export type ProductStatus = "ACTIVE" | "INACTIVE";

export type TicketProductResponse = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  durationUnit: DurationUnit;
  durationValue: number;
  priceVnd: number;
  /** Số kỳ tối đa mua một lần (vé tháng). */
  maxPeriods: number;
  /** Số ngày được phép chờ trước khi quẹt lần đầu. */
  activationWindowDays: number;
  status: ProductStatus;
  /** Đã bán thì không xoá được, chỉ ngừng bán. */
  hasSoldTickets: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  /** Gửi lại khi sửa; lệch version → 409. */
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicTicketProduct = {
  code: string;
  name: string;
  description: string | null;
  durationUnit: DurationUnit;
  durationValue: number;
  priceVnd: number;
  maxPeriods: number;
  activationWindowDays: number;
  singleJourney: boolean;
};

export type TicketProductAudit = {
  id: number;
  action: "CREATED" | "UPDATED" | "ACTIVATED" | "DEACTIVATED" | "DELETED";
  changedBy: string | null;
  /** Chuỗi JSON mô tả thay đổi. */
  changes: string | null;
  changedAt: string;
};

export type CreateTicketProductBody = {
  /** Chữ, số, gạch dưới; 2–30 ký tự. Không đổi được sau khi tạo. */
  code: string;
  name: string;
  description?: string;
  durationUnit: DurationUnit;
  /** 1..12 */
  durationValue: number;
  priceVnd: number;
  maxPeriods?: number;
  activationWindowDays?: number;
  status?: ProductStatus;
};
/** `version` bắt buộc; field khác bỏ trống: giữ nguyên. Trạng thái đổi qua activate/deactivate. */
export type UpdateTicketProductBody = { version: number } & Partial<
  Omit<CreateTicketProductBody, "code" | "status">
>;

export type TicketPriceStatus = "PENDING_APPROVAL" | "APPROVED" | "APPLIED" | "REJECTED";

export type TicketPriceResponse = {
  id: number;
  productId: number;
  productCode: string;
  priceVnd: number;
  effectiveFrom: string;
  status: TicketPriceStatus;
  createdBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  appliedAt: string | null;
};

/** Giá vé lượt của một loại vé: đơn giá/km, làm tròn lên bội số `roundingVnd`, không thấp hơn `minFareVnd`. */
export type FareConfig = {
  productCode: string;
  productName: string;
  farePerKmVnd: number;
  roundingVnd: number;
  minFareVnd: number;
};
export type FareQuote = {
  productCode: string;
  fromStationId: number;
  toStationId: number;
  distanceKm: number;
  farePerKmVnd: number;
  roundingVnd: number;
  minFareVnd: number;
  priceVnd: number;
};

export type TicketStatus =
  "PENDING_PAYMENT" | "ACTIVE" | "IN_USE" | "USED" | "EXPIRED" | "REFUNDED" | "CANCELLED";

export type TicketStationRef = { id: number; code: string; name: string };

export type PaymentOrderStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

/** Hướng dẫn chuyển khoản SePay cho đơn đang chờ thanh toán. */
export type PaymentInstruction = {
  orderCode: string;
  amountVnd: number;
  status: PaymentOrderStatus;
  expiresAt: string;
  bank: string;
  accountNumber: string;
  accountHolder: string;
  transferContent: string;
  qrImageUrl: string;
  paidAt: string | null;
};

export type TicketResponse = {
  id: string;
  ticketCode: string;
  /** Chỉ trả cho chính chủ vé, nên luôn null ở web quản trị. */
  qrToken: string | null;
  userId: string;
  productCode: string;
  productName: string;
  durationUnit: DurationUnit;
  durationValue: number;
  periods: number;
  listUnitPriceVnd: number;
  discountCode: string | null;
  discountPercent: number;
  unitPriceVnd: number;
  priceVnd: number;
  status: TicketStatus;
  purchasedAt: string;
  validFrom: string | null;
  validUntil: string | null;
  activatedAt: string | null;
  lastEntryStation: TicketStationRef | null;
  lastEntryAt: string | null;
  tripsCount: number;
  refundable: boolean;
  refundedAt: string | null;
  payment: PaymentInstruction | null;
  pointsUsed: number;
  originStation: TicketStationRef | null;
  destinationStation: TicketStationRef | null;
  distanceKm: number | null;
};

export type AdminTicketQuery = PageQuery & {
  status?: TicketStatus;
  productCode?: string;
  userId?: string;
  ticketCode?: string;
};

export type GateDirection = "ENTRY" | "EXIT";
export type TicketValidation = {
  id: number;
  station: TicketStationRef | null;
  direction: GateDirection;
  result: "ACCEPTED" | "REJECTED";
  reason: string | null;
  validatedBy: string | null;
  validatedAt: string;
};

// ---- Thanh toán, giao dịch, đối soát (/api/v1/admin, cần PAYMENT_MANAGE) ----

export type PaymentPurpose =
  | "TICKET"
  | "TICKET_FARE_ADJUSTMENT"
  | "PARKING_SESSION"
  | "PARKING_MONTHLY_PASS"
  | "PARKING_BOOKING";
export type PaymentMethod = "CASH" | "CARD" | "E_WALLET" | "BANK_TRANSFER" | "SEPAY_QR";
export type PaymentStatus = "SUCCEEDED" | "REFUND_PENDING" | "REFUNDED";
export type SepayResult = "MATCHED" | "UNMATCHED" | "AMOUNT_MISMATCH" | "NEEDS_REFUND" | "IGNORED";

export type PaymentView = {
  id: string;
  userId: string;
  purpose: PaymentPurpose;
  /** Mã vé / phiên gửi xe... tuỳ `purpose`. */
  referenceId: string | null;
  amountVnd: number;
  method: PaymentMethod;
  status: PaymentStatus;
  providerRef: string | null;
  createdAt: string;
  refundedAt: string | null;
};

export type TransactionQuery = PageQuery & {
  /** yyyy-MM-dd, theo giờ Việt Nam, lấy cả ngày `to`. */
  from?: string;
  to?: string;
  purpose?: PaymentPurpose;
  status?: PaymentStatus;
  /** Tìm gần đúng theo mã giao dịch của cổng thanh toán. */
  providerRef?: string;
};

/** Luôn mới nhất trước. `totalAmountVnd`: tổng tiền của mọi trang theo bộ lọc. */
export type TransactionPage = { transactions: Page<PaymentView>; totalAmountVnd: number };

export type PaymentOrderView = {
  id: string;
  orderCode: string;
  userId: string;
  purpose: PaymentPurpose;
  referenceId: string | null;
  amountVnd: number;
  status: PaymentOrderStatus;
  expiresAt: string;
  paidAt: string | null;
  paidAmountVnd: number | null;
  sepayTransactionId: number | null;
  createdAt: string;
};

export type SepayTransactionView = {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  code: string | null;
  content: string | null;
  transferType: string;
  transferAmount: number;
  referenceCode: string | null;
  orderId: string | null;
  result: SepayResult;
  note: string | null;
  receivedAt: string;
};

export type ReconcileMismatch = {
  sepayId: number | null;
  paymentId: string | null;
  gatewayAmountVnd: number;
  systemAmountVnd: number | null;
  result: SepayResult;
  reason: string;
};

export type ReconcileResult = {
  from: string;
  to: string;
  gatewayCount: number;
  matchedCount: number;
  mismatchedCount: number;
  gatewayTotalVnd: number;
  systemTotalVnd: number;
  mismatches: ReconcileMismatch[];
};

export type ReconcileNote = {
  sepayId: number;
  reconciled: boolean;
  reconciledAt: string | null;
  note: string;
};

// ---- Báo cáo (/api/v1/reports) ----
// Doanh thu cần REPORT_VIEW, lưu lượng cần REPORT_TRAFFIC_VIEW, xuất file cần REPORT_EXPORT.

export type RevenueGroup = "DAY" | "MONTH" | "PRODUCT" | "SERVICE";
export type TrafficGroup = "STATION" | "LINE" | "HOUR";
export type ReportFormat = "xlsx" | "pdf";

export type ReportRow = { label: string; count: number; amountVnd: number | null };
export type Report = {
  title: string;
  from: string;
  to: string;
  totalCount: number;
  /** null với báo cáo lưu lượng. */
  totalAmountVnd: number | null;
  rows: ReportRow[];
};

/** `from`, `to`: yyyy-MM-dd. */
export type ReportQuery<G> = { from: string; to: string; groupBy?: G };

// ---- Sự cố tại ga (/api/v1, quản lý cần INCIDENT_MANAGE) ----

export type IncidentType = "EQUIPMENT" | "SECURITY" | "MEDICAL" | "PASSENGER" | "OTHER";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

export type IncidentResponse = {
  id: number;
  stationId: number;
  stationName: string;
  reportedBy: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  hasImage: boolean;
  status: IncidentStatus;
  handledBy: string | null;
  resolution: string | null;
  acceptedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type IncidentListQuery = PageQuery & { status?: IncidentStatus };

// ---- Thông báo vận hành (/api/v1/announcements) ----
// Tạo/sửa/gửi duyệt cần ANNOUNCEMENT_MANAGE, duyệt/từ chối cần ANNOUNCEMENT_APPROVE.

export type AnnouncementApiSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AnnouncementApiStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type AnnouncementScope = "ALL" | "LINE" | "STATION" | "ROLE";

export type AnnouncementResponse = {
  id: number;
  lineId: number | null;
  stationId: number | null;
  title: string;
  content: string;
  severity: AnnouncementApiSeverity;
  startsAt: string | null;
  endsAt: string | null;
  status: AnnouncementApiStatus;
  scope: AnnouncementScope;
  /** Mã vai trò khi `scope = ROLE`. */
  targetRole: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAnnouncementBody = {
  lineId?: number;
  stationId?: number;
  title: string;
  content: string;
  severity?: AnnouncementApiSeverity;
  startsAt?: string;
  endsAt?: string;
  scope?: AnnouncementScope;
  targetRole?: string;
};
export type UpdateAnnouncementBody = Partial<CreateAnnouncementBody>;

// ---- Chiến dịch thông báo (/api/v1/admin/notification-campaigns) ----
// Xem cần NOTIFICATION_MANAGE hoặc REPORT_VIEW, thay đổi cần NOTIFICATION_MANAGE.

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED" | "FAILED";
export type AudienceType =
  "ALL" | "ROLE" | "LINE" | "STATION" | "STUDENTS" | "ACTIVE_PASS_HOLDERS" | "USERS";

export type CampaignBody = {
  title: string;
  body: string;
  /** Chỉ nhận ANNOUNCEMENT, PROMOTION, SYSTEM. */
  type: NotificationType;
  priority?: NotificationPriority;
  /** Đường dẫn trong app, bắt đầu bằng "/". Không nhận URL ngoài. */
  link?: string;
  audienceType: AudienceType;
  /** Mã vai trò (ROLE), lineId (LINE) hoặc stationId (STATION), dạng chuỗi. */
  audienceValue?: string;
  /** Khi `audienceType = USERS`, tối đa 5000. */
  userIds?: string[];
  push?: boolean;
  email?: boolean;
};

export type CampaignResponse = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  link: string | null;
  audienceType: AudienceType;
  audienceValue: string | null;
  push: boolean;
  email: boolean;
  status: CampaignStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recipientCount: number;
  pushQueued: number;
  emailQueued: number;
  /** ANNOUNCEMENT: tạo tự động khi thông báo vận hành được duyệt. */
  source: "ADMIN" | "ANNOUNCEMENT";
  announcementId: number | null;
  error: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  sentBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CampaignPreview = {
  recipients: number;
  emailAllowed: boolean;
  maxEmailRecipients: number;
};

export type DeliveryStatus = "PENDING" | "SENDING" | "SENT" | "FAILED" | "SKIPPED";
export type CampaignStats = {
  campaignId: string;
  status: CampaignStatus;
  recipients: number;
  /** Số người đã mở trong app. */
  read: number;
  /** Ví dụ: `{ PUSH: { SENT: 10, FAILED: 1 }, EMAIL: { SENT: 9 } }`. */
  deliveries: Partial<Record<"PUSH" | "EMAIL", Partial<Record<DeliveryStatus, number>>>>;
};

export type CampaignListQuery = PageQuery & { status?: CampaignStatus };

// ---- Chatbot (/api/v1/admin/chatbot, cần CHATBOT_MANAGE) ----

export type ChatFaqResponse = {
  id: number;
  category: string;
  question: string;
  answer: string;
  keywords: string | null;
  updatedAt: string;
};

export type ChatFaqBody = {
  /** Tối đa 30 ký tự. */
  category: string;
  question: string;
  answer: string;
  keywords?: string;
};

// ---- Hành trình xanh, hạng thành viên (/api/v1) ----

export type GreenLevel = "SEED" | "SPROUT" | "SAPLING" | "TREE" | "FOREST";

export type GreenSettings = {
  enabled: boolean;
  /** CO₂ của phương tiện cá nhân (g/km) để so sánh. */
  baselineGramsPerKm: number;
  metroGramsPerKm: number;
  pointsPerKm: number;
  minTripMinutes: number;
  maxTripMinutes: number;
  maxCountedTripsPerDay: number;
  /** CO₂ một cây hấp thụ mỗi năm (g). */
  treeGramsPerYear: number;
  version: number;
  updatedAt: string | null;
};

/** `version` bắt buộc; field khác bỏ trống: giữ nguyên. */
export type UpdateGreenSettingsBody = { version: number } & Partial<
  Omit<GreenSettings, "version" | "updatedAt">
>;

export type GreenPublicStats = {
  trips: number;
  distanceKm: number;
  co2SavedKg: number;
  treeYearsEquivalent: number;
};

export type GreenLeaderboard = {
  /** yyyy-MM */
  month: string;
  entries: {
    rank: number;
    /** Chỉ tên viết tắt. */
    displayName: string;
    points: number;
    co2SavedKg: number;
    trips: number;
    me: boolean;
  }[];
};

export type MembershipTier = { code: string; name: string; minPoints: number };

// ---- Tham số hệ thống, nhật ký thao tác (/api/v1/admin) ----

/** Mã tham số backend đang dùng (giá trị số nguyên). */
export type SystemParamKey =
  | "CPOINT_PER_CHECKIN"
  | "CPOINT_MAX_CHECKINS_PER_DAY"
  | "CPOINT_MAX_DISCOUNT_VND"
  | "PAYMENT_QR_TTL_MINUTES"
  | "PARKING_OVERTIME_FEE_PER_HOUR"
  | "FARE_ROUNDING_VND"
  | "FARE_MIN_VND";

export type SystemParamResponse = {
  key: string;
  group: string;
  /** Lưu dạng chuỗi, đọc theo `valueType`. */
  value: string;
  valueType: string;
  description: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
};

/** `effectiveFrom` bỏ trống: áp dụng ngay. */
export type UpdateSystemParamBody = { value: number; effectiveFrom?: string };

/** Nhật ký thao tác nghiệp vụ (khác `AuditLog` là sự kiện đăng nhập/bảo mật). */
export type ActionLog = {
  id: number;
  userId: string | null;
  action: string;
  tableName: string | null;
  recordId: string | null;
  content: string | null;
  /** Chuỗi JSON. */
  oldData: string | null;
  newData: string | null;
  ipAddress: string | null;
  eventTime: string;
};

export type ActionLogQuery = PageQuery & { action?: string };

export type BannerResponse = {
  id: string;
  title: string;
  subtitle: string | null;
  linkPath: string | null;
  imagePath: string;
};

export type CreateBannerInput = {
  image: Blob;
  title: string;
  subtitle?: string;
  linkPath?: string;
  position?: number;
};

// ---- Xác thực sinh viên (/api/v1/admin, cần STUDENT_VERIFY / STUDENT_POLICY_MANAGE) ----

export type StudentVerificationStatus =
  "PENDING" | "PROCESSING" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED" | "REVOKED";

export type StudentVerificationResponse = {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  status: StudentVerificationStatus;
  declaredFullName: string;
  declaredStudentCode: string;
  declaredSchool: string;
  aiAttempts: number;
  aiModel: string | null;
  aiIsStudentCard: boolean | null;
  aiFullName: string | null;
  aiStudentCode: string | null;
  aiSchool: string | null;
  aiValidUntil: string | null;
  /** 0..1 */
  aiConfidence: number | null;
  aiTamperingSuspected: boolean | null;
  aiNotes: string | null;
  aiError: string | null;
  aiCompletedAt: string | null;
  decisionSource: "AI" | "MANUAL" | null;
  decisionReasons: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  approvedUntil: string | null;
  submittedAt: string;
  decidedAt: string | null;
  /** Ảnh thẻ bị xoá sau thời gian lưu trữ. */
  imageAvailable: boolean;
};

export type StudentVerificationQuery = PageQuery & { status?: StudentVerificationStatus };

export type StudentPolicy = {
  enabled: boolean;
  autoApprove: boolean;
  /** 0.5..1 */
  minConfidence: number;
  acceptedSchools: string[];
  requireNameMatch: boolean;
  requireAccountNameMatch: boolean;
  requireStudentCodeMatch: boolean;
  requireNotExpired: boolean;
  requireValidUntil: boolean;
  defaultValidityMonths: number;
  maxValidityMonths: number;
  discountPercent: number;
  eligibleProductCodes: string[];
  maxSubmissionsPer30Days: number;
  imageRetentionDays: number;
  aiConfigured: boolean;
  aiModel: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
  version: number;
};

/** `version` bắt buộc; field khác bỏ trống: giữ nguyên. */
export type UpdateStudentPolicyBody = { version: number } & Partial<
  Omit<StudentPolicy, "aiConfigured" | "aiModel" | "updatedBy" | "updatedAt" | "version">
>;

// ---- Bãi gửi xe (/api/v1, cần PARKING_MANAGE) ----

export type VehicleType = "BICYCLE" | "MOTORBIKE" | "CAR";
export type ParkingLotStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type ParkingSessionStatus = "PARKED" | "COMPLETED";

export type ParkingRate = {
  vehicleType: VehicleType;
  capacity: number;
  occupied: number;
  available: number;
  dayPriceVnd: number;
  overnightPriceVnd: number;
  monthlyPriceVnd: number;
  parkAndRideDiscountPercent: number;
};

export type ParkingLotResponse = {
  id: number;
  code: string;
  name: string;
  address: string | null;
  stationId: number;
  stationCode: string;
  stationName: string;
  openTime: string;
  closeTime: string;
  status: ParkingLotStatus;
  openNow: boolean;
  vehicles: ParkingRate[];
};

export type CreateParkingLotBody = {
  stationId: number;
  code: string;
  name: string;
  address?: string;
  openTime: string;
  closeTime: string;
  status?: ParkingLotStatus;
};
export type UpdateParkingLotBody = Partial<Omit<CreateParkingLotBody, "stationId" | "code">>;

export type UpsertParkingRateBody = {
  capacity: number;
  dayPriceVnd: number;
  overnightPriceVnd: number;
  monthlyPriceVnd: number;
  /** 0..100 */
  parkAndRideDiscountPercent?: number;
};

export type ParkingSession = {
  id: string;
  sessionCode: string;
  lotId: number;
  lotCode: string;
  lotName: string;
  vehicleType: VehicleType;
  plateNumber: string | null;
  status: ParkingSessionStatus;
  checkInAt: string;
  checkOutAt: string | null;
  monthlyPassCode: string | null;
  feeVnd: number | null;
  discountVnd: number | null;
  payableVnd: number | null;
  paymentMethod: PaymentMethod | null;
  estimatedFeeVnd: number | null;
};

export type ParkingSessionQuery = PageQuery & { status?: ParkingSessionStatus };
