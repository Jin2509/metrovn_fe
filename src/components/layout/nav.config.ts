import {
  Activity,
  BadgePercent,
  Building2,
  Inbox,
  LayoutDashboard,
  LineChart,
  Lock,
  Map,
  Megaphone,
  Receipt,
  ScrollText,
  Ticket,
  TrainFront,
  Users,
  type LucideIcon,
} from "lucide-react";
import { canAccessRoute, normalizePath, type ProtectedPath, type Role } from "@/lib/auth";

// Cấu trúc menu (nhóm, nhãn, icon, mô tả). Quyền xem từng mục KHÔNG khai báo ở đây mà lấy từ
// ROUTE_ACCESS trong `@/lib/auth/permissions` — kiểu `ProtectedPath` buộc mọi mục menu phải có quy tắc.
// Các chức năng gần nhau được gom thành tab trong cùng một trang (xem `PageTabs`) thay vì tách menu.
export type NavItem = { to: ProtectedPath; label: string; icon: LucideIcon; description: string };
export type NavGroup = { title: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    title: "Chung",
    items: [
      {
        to: "/",
        label: "Tổng quan",
        icon: LayoutDashboard,
        description: "Chỉ số chính, doanh thu và lưu lượng trong ngày",
      },
    ],
  },
  {
    title: "Mạng lưới",
    items: [
      {
        to: "/map",
        label: "Bản đồ & xe buýt",
        icon: Map,
        description: "Bản đồ tuyến, ga và các tuyến buýt kết nối",
      },
      {
        to: "/stations",
        label: "Ga & tuyến",
        icon: Building2,
        description: "Danh sách ga, thứ tự ga và kết cấu từng tuyến",
      },
      {
        to: "/trains",
        label: "Tàu & vận hành",
        icon: TrainFront,
        description: "Đội tàu và cấu hình giờ vận hành, giãn cách",
      },
    ],
  },
  {
    title: "Kinh doanh",
    items: [
      {
        to: "/tickets",
        label: "Giá vé & gửi xe",
        icon: Ticket,
        description: "Loại vé, giá theo cự ly, bãi xe và giá gửi xe",
      },
      {
        to: "/promotions",
        label: "Ưu đãi & thành viên",
        icon: BadgePercent,
        description: "Chương trình khuyến mãi và hạng thành viên",
      },
      {
        to: "/notifications",
        label: "Thông báo vận hành",
        icon: Megaphone,
        description: "Soạn và gửi thông báo tới hành khách",
      },
    ],
  },
  {
    title: "Điều hành",
    items: [
      {
        to: "/approvals",
        label: "Phê duyệt & chính sách",
        icon: Inbox,
        description: "Duyệt thay đổi và xem chính sách đang áp dụng",
      },
    ],
  },
  {
    title: "Tài chính",
    items: [
      {
        to: "/transactions",
        label: "Giao dịch & đối soát",
        icon: Receipt,
        description: "Tra cứu giao dịch và đối soát với cổng thanh toán",
      },
      {
        to: "/revenue",
        label: "Doanh thu",
        icon: LineChart,
        description: "Doanh thu theo thời gian, dịch vụ và phương thức",
      },
      {
        to: "/period-closing",
        label: "Chốt kỳ",
        icon: Lock,
        description: "Chốt sổ và quyết toán theo tháng",
      },
    ],
  },
  {
    title: "Giám sát",
    items: [
      {
        to: "/station-stats",
        label: "Thống kê vận hành",
        icon: Activity,
        description: "Doanh thu, lưu lượng theo ga và theo khung giờ",
      },
      {
        to: "/audit-logs",
        label: "Nhật ký hệ thống",
        icon: ScrollText,
        description: "Lịch sử thao tác của người dùng quản trị",
      },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      {
        to: "/users",
        label: "Tài khoản & phân công",
        icon: Users,
        description: "Tài khoản nội bộ và phân công nhân viên theo ga",
      },
    ],
  },
];

/** Menu mà vai trò này được thấy (nhóm rỗng bị ẩn). */
export function getVisibleNavGroups(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({ ...group, items: group.items.filter((i) => canAccessRoute(role, i.to)) }))
    .filter((group) => group.items.length > 0);
}

export function findNavItem(pathname: string): NavItem | undefined {
  const path = normalizePath(pathname);
  return navGroups.flatMap((g) => g.items).find((i) => i.to === path);
}

export function findNavGroup(pathname: string): NavGroup | undefined {
  const path = normalizePath(pathname);
  return navGroups.find((g) => g.items.some((i) => i.to === path));
}
