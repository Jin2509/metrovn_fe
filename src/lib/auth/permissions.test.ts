import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { navGroups } from "@/components/layout/nav.config";
import { routeTree } from "@/routeTree.gen";
import {
  ACTION_ACCESS,
  ACTION_LABELS,
  PUBLIC_PATHS,
  ROLES,
  ROUTE_ACCESS,
  can,
  canAccessRoute,
  findRouteRule,
  isPublicPath,
} from "./permissions";

describe("ROUTE_ACCESS", () => {
  it("khai báo quyền cho mọi route thật của app (trừ trang công khai)", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const registered = Object.keys(router.routesByPath).filter(
      (path) => !(PUBLIC_PATHS as readonly string[]).includes(path),
    );

    expect(registered.length).toBeGreaterThan(0);
    for (const path of registered) expect(ROUTE_ACCESS, path).toHaveProperty([path]);
  });

  it("không có mục menu nào thiếu quy tắc, và mọi quy tắc đều có route thật", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const item of navGroups.flatMap((g) => g.items)) {
      expect(ROUTE_ACCESS, item.to).toHaveProperty([item.to]);
    }
    for (const path of Object.keys(ROUTE_ACCESS)) {
      expect(router.routesByPath, path).toHaveProperty([path]);
    }
  });

  it("mọi vai trò đều mở được trang tổng quan và mỗi route có ít nhất một vai trò", () => {
    for (const role of ROLES) expect(canAccessRoute(role, "/")).toBe(true);
    for (const [path, roles] of Object.entries(ROUTE_ACCESS)) {
      expect(roles.length, path).toBeGreaterThan(0);
    }
  });
});

describe("canAccessRoute", () => {
  it("Admin: cấu hình hệ thống nhưng không phê duyệt hay chốt kỳ", () => {
    expect(canAccessRoute("ADMIN", "/users")).toBe(true);
    expect(canAccessRoute("ADMIN", "/audit-logs")).toBe(true);
    expect(canAccessRoute("ADMIN", "/transactions")).toBe(true);
    expect(canAccessRoute("ADMIN", "/approvals")).toBe(false);
    expect(canAccessRoute("ADMIN", "/period-closing")).toBe(false);
  });

  it("Manager: phê duyệt, chính sách, doanh thu và theo dõi chatbot", () => {
    expect(canAccessRoute("MANAGER", "/approvals")).toBe(true);
    expect(canAccessRoute("MANAGER", "/revenue")).toBe(true);
    expect(canAccessRoute("MANAGER", "/chatbot")).toBe(true);
    expect(canAccessRoute("MANAGER", "/users")).toBe(false);
    expect(canAccessRoute("MANAGER", "/settings")).toBe(false);
    expect(canAccessRoute("MANAGER", "/transactions")).toBe(false);
  });

  it("chatbot: Admin quản trị, Manager theo dõi, Kế toán không vào", () => {
    expect(canAccessRoute("ADMIN", "/chatbot")).toBe(true);
    expect(canAccessRoute("ACCOUNTANT", "/chatbot")).toBe(false);
  });

  it("cấu hình hệ thống chỉ Admin; cài đặt tài khoản cho mọi vai trò", () => {
    expect(canAccessRoute("ADMIN", "/settings")).toBe(true);
    expect(canAccessRoute("ACCOUNTANT", "/settings")).toBe(false);
    for (const role of ROLES) expect(canAccessRoute(role, "/profile"), role).toBe(true);
  });

  it("Kế toán: giao dịch, đối soát, doanh thu, chốt kỳ", () => {
    for (const path of ["/transactions", "/revenue", "/period-closing", "/station-stats"])
      expect(canAccessRoute("ACCOUNTANT", path), path).toBe(true);
    expect(canAccessRoute("ACCOUNTANT", "/users")).toBe(false);
    expect(canAccessRoute("ACCOUNTANT", "/approvals")).toBe(false);
  });

  it("chuẩn hóa dấu / cuối, query, hash và kế thừa quyền cho route con", () => {
    expect(canAccessRoute("MANAGER", "/users/")).toBe(false);
    expect(canAccessRoute("MANAGER", "/users?tab=1")).toBe(false);
    expect(canAccessRoute("MANAGER", "/users/U1000")).toBe(false);
    expect(canAccessRoute("ADMIN", "/users/U1000#top")).toBe(true);
    // "/usersx" không phải route con của "/users"
    expect(findRouteRule("/usersx")).toBeUndefined();
  });

  it("đường dẫn lạ (404) được cho qua để hiện trang không tìm thấy", () => {
    expect(canAccessRoute("MANAGER", "/khong-ton-tai")).toBe(true);
  });
});

describe("can (thao tác)", () => {
  it("chỉ Admin và Kế toán được xuất báo cáo doanh thu", () => {
    expect(can("ADMIN", "revenue.export")).toBe(true);
    expect(can("ACCOUNTANT", "revenue.export")).toBe(true);
    expect(can("MANAGER", "revenue.export")).toBe(false);
  });

  it("chỉ Admin xem được lưu lượng theo khung giờ trong trang thống kê", () => {
    expect(can("ADMIN", "stats.hourlyFlow")).toBe(true);
    expect(can("MANAGER", "stats.hourlyFlow")).toBe(false);
    expect(can("ACCOUNTANT", "stats.hourlyFlow")).toBe(false);
  });

  it("chỉ Admin đọc hội thoại và sửa kiến thức/cấu hình chatbot", () => {
    for (const action of ["chatbot.conversations", "chatbot.manage"] as const) {
      expect(can("ADMIN", action), action).toBe(true);
      expect(can("MANAGER", action), action).toBe(false);
      expect(can("ACCOUNTANT", action), action).toBe(false);
    }
  });

  it("mọi thao tác đều có mô tả cho bảng phân quyền", () => {
    for (const action of Object.keys(ACTION_ACCESS)) {
      expect(ACTION_LABELS, action).toHaveProperty([action]);
    }
  });
});

describe("isPublicPath", () => {
  it("chỉ /login là công khai", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/")).toBe(true);
    expect(isPublicPath("/users")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
  });
});
