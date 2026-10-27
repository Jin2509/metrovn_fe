import type { Role } from "./auth.types";

/**
 * NGUỒN DUY NHẤT cho phân quyền phía giao diện.
 *
 * - ROUTE_ACCESS: vai trò nào được mở màn hình nào (menu, route guard và test đều đọc từ đây).
 * - ACTION_ACCESS: vai trò nào được thực hiện thao tác nhạy cảm bên trong một màn hình.
 *
 * Lưu ý: đây chỉ là lớp chặn ở UI. Khi có backend thật, API phải kiểm tra lại quyền ở server.
 */

export const ROLES: readonly Role[] = ["ADMIN", "MANAGER", "ACCOUNTANT"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  ACCOUNTANT: "Kế toán",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Cấu hình mạng lưới, giá vé, chatbot, tài khoản và theo dõi vận hành",
  MANAGER: "Phê duyệt thay đổi, theo dõi chính sách và chất lượng chatbot",
  ACCOUNTANT: "Giao dịch, đối soát và chốt kỳ tài chính",
};

const ADMIN: readonly Role[] = ["ADMIN"];
const MANAGER: readonly Role[] = ["MANAGER"];
const ACCOUNTANT: readonly Role[] = ["ACCOUNTANT"];
const FINANCE: readonly Role[] = ["ADMIN", "ACCOUNTANT"];
const OVERSIGHT: readonly Role[] = ["ADMIN", "MANAGER"];
const EVERYONE: readonly Role[] = ROLES;

export const ROUTE_ACCESS = {
  "/": EVERYONE,
  // Mạng lưới (tab: bản đồ/xe buýt · danh sách ga/tuyến)
  "/map": ADMIN,
  "/stations": ADMIN,
  "/trains": ADMIN,
  // Kinh doanh (tab: loại vé/gửi xe · khuyến mãi/hạng thành viên)
  "/tickets": ADMIN,
  "/promotions": ADMIN,
  // Khách hàng: thông báo tới hành khách + chatbot hỗ trợ tích hợp trong app.
  // Manager chỉ xem tab "Thống kê"; lịch sử hội thoại và kho tri thức là của Admin (ACTION_ACCESS).
  "/notifications": ADMIN,
  "/chatbot": OVERSIGHT,
  // Điều hành (tab: hộp phê duyệt/chính sách đang áp dụng)
  "/approvals": MANAGER,
  // Tài chính (tab: tra cứu giao dịch/đối soát)
  "/transactions": FINANCE,
  "/revenue": EVERYONE,
  "/period-closing": ACCOUNTANT,
  // Giám sát — doanh thu + lưu lượng theo ga: Admin vận hành, Manager theo dõi, Kế toán đối chiếu.
  // Tab "lưu lượng theo giờ" bên trong chỉ dành cho Admin (xem ACTION_ACCESS).
  "/station-stats": EVERYONE,
  "/audit-logs": ADMIN,
  // Hệ thống (tab: tài khoản/phân công ga)
  "/users": ADMIN,
  "/settings": ADMIN,
  // Cài đặt tài khoản cá nhân (hồ sơ, mật khẩu, thông báo, giao diện) — mở từ thẻ người dùng.
  "/profile": EVERYONE,
} as const satisfies Record<string, readonly Role[]>;

export type ProtectedPath = keyof typeof ROUTE_ACCESS;

export const ACTION_ACCESS = {
  /** Xuất báo cáo doanh thu — Manager chỉ được xem. */
  "revenue.export": FINANCE,
  /** Lưu lượng theo khung giờ của từng ga — dữ liệu vận hành chi tiết. */
  "stats.hourlyFlow": ADMIN,
  /** Đọc nội dung hội thoại của hành khách với chatbot (dữ liệu cá nhân). */
  "chatbot.conversations": ADMIN,
  /** Thêm, sửa, bật/tắt câu hỏi trong kho tri thức (chatbot_faq). */
  "chatbot.manage": ADMIN,
  /**
   * Đối soát là nghiệp vụ kế toán: chỉ Kế toán được tick chọn giao dịch và xác nhận "Đã đối soát".
   * Admin vẫn mở được trang Giao dịch & đối soát (FINANCE ở ROUTE_ACCESS) nhưng chỉ xem.
   */
  "reconciliation.confirm": ACCOUNTANT,
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof ACTION_ACCESS;

/** Mô tả thao tác cho bảng phân quyền ở trang Cấu hình hệ thống. */
export const ACTION_LABELS: Record<Action, string> = {
  "revenue.export": "Xuất báo cáo doanh thu",
  "stats.hourlyFlow": "Xem lưu lượng theo khung giờ",
  "chatbot.conversations": "Đọc hội thoại chatbot của hành khách",
  "chatbot.manage": "Quản lý kho tri thức chatbot (FAQ)",
  "reconciliation.confirm": "Xác nhận đối soát giao dịch",
};

/** Các route không cần đăng nhập. */
export const PUBLIC_PATHS = ["/login"] as const;

export function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] || "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function isPublicPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return PUBLIC_PATHS.some((p) => p === path);
}

/** Tìm quy tắc khớp nhất (hỗ trợ route con như /users/U1000 kế thừa quyền của /users). */
export function findRouteRule(pathname: string): readonly Role[] | undefined {
  const path = normalizePath(pathname);
  if (path in ROUTE_ACCESS) return ROUTE_ACCESS[path as ProtectedPath];
  const parent = (Object.keys(ROUTE_ACCESS) as ProtectedPath[])
    .filter((p) => p !== "/" && path.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return parent ? ROUTE_ACCESS[parent] : undefined;
}

/**
 * Role có được mở đường dẫn này không.
 * Đường dẫn chưa khai báo (vd. 404) được cho qua để hiện trang "không tìm thấy";
 * test `permissions.test.ts` đảm bảo mọi route thật đều đã khai báo ở ROUTE_ACCESS.
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  const rule = findRouteRule(pathname);
  return rule ? rule.includes(role) : true;
}

export function can(role: Role, action: Action): boolean {
  return (ACTION_ACCESS[action] as readonly Role[]).includes(role);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
