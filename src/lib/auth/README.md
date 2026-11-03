# Xác thực & phân quyền

```
lib/auth/
  permissions.ts    ← NGUỒN DUY NHẤT: ROUTE_ACCESS (màn hình) + ACTION_ACCESS (thao tác)
  session.store.ts  ← trạng thái đăng nhập, lưu/đọc phiên + token, hết hạn, đồng bộ giữa các tab
  auth.service.ts   ← login/logout/đổi mật khẩu/hồ sơ, gọi backend qua lib/api
  use-auth.ts       ← hook useAuth(): user, role, can(action)
components/auth/    ← AuthGate (chặn route), AccessDenied, RoleBadge, Can, AuthSplash
components/layout/  ← AppShell, Sidebar, MobileNav, Header, UserCard, nav.config.ts
pages/login/        ← trang /login (theo cấu trúc pages/<feature> của dự án)
pages/forgotpassword/ ← /forgot-password và /reset-password (web không có đăng ký, tài khoản do Admin tạo)
```

## Thêm một màn hình mới

1. Tạo route + page như các trang khác (không cần truyền `roles` cho `AppShell`).
2. Khai báo vai trò được vào ở `ROUTE_ACCESS` (`permissions.ts`).
3. Thêm mục menu ở `components/layout/nav.config.ts` (kiểu `ProtectedPath` sẽ báo lỗi nếu bước 2 bị quên).
   Test `permissions.test.ts` cũng fail nếu có route thật mà chưa khai báo quyền.

## Chặn một thao tác bên trong màn hình

Khai báo ở `ACTION_ACCESS`, rồi dùng `<Can action="...">` hoặc `useAuth().can("...")`.

## Vai trò web và quyền backend

- `GET /api/me` trả `roles` và `permissions`. `resolveRole()` chọn vai trò web theo mã: `ADMIN`, `MANAGER`, `ACCOUNTANT`.
- Tài khoản không có vai trò nào trong 3 mã trên (hành khách, nhân viên soát vé) không đăng nhập được vào web.
- `ROUTE_ACCESS`/`ACTION_ACCESS` vẫn chặn theo vai trò web. `useAuth().hasPermission("USER_MANAGE")` kiểm tra theo mã quyền của backend.
- Lớp chặn ở UI chỉ để ẩn/hiện. Backend kiểm tra lại quyền ở mọi API.

Lớp gọi API và luồng refresh token nằm ở `lib/api/client.ts`.
