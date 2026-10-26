# Xác thực & phân quyền

```
lib/auth/
  permissions.ts    ← NGUỒN DUY NHẤT: ROUTE_ACCESS (màn hình) + ACTION_ACCESS (thao tác)
  session.store.ts  ← trạng thái đăng nhập, lưu/đọc phiên, hết hạn, đồng bộ giữa các tab
  auth.service.ts   ← login()/logout() GIẢ LẬP (dữ liệu ở mocks/accounts.ts)
  use-auth.ts       ← hook useAuth(): user, role, can(action)
components/auth/    ← AuthGate (chặn route), AccessDenied, RoleBadge, Can, AuthSplash
components/layout/  ← AppShell, Sidebar, MobileNav, Header, UserCard, nav.config.ts
pages/login/        ← trang /login (theo cấu trúc pages/<feature> của dự án)
```

## Thêm một màn hình mới
1. Tạo route + page như các trang khác (không cần truyền `roles` cho `AppShell`).
2. Khai báo vai trò được vào ở `ROUTE_ACCESS` (`permissions.ts`).
3. Thêm mục menu ở `components/layout/nav.config.ts` (kiểu `ProtectedPath` sẽ báo lỗi nếu bước 2 bị quên).
   Test `permissions.test.ts` cũng fail nếu có route thật mà chưa khai báo quyền.

## Chặn một thao tác bên trong màn hình
Khai báo ở `ACTION_ACCESS`, rồi dùng `<Can action="...">` hoặc `useAuth().can("...")`.

## Tài khoản demo (mocks/accounts.ts)
| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | admin@metro.vn | Metro@2026 |
| Manager | manager@metro.vn | Metro@2026 |
| Kế toán | accountant@metro.vn | Metro@2026 |

Ẩn khối tài khoản demo ở trang đăng nhập bằng `VITE_SHOW_DEMO_ACCOUNTS=false`.

## Khi nối backend thật
- Thay thân `login`/`logout` trong `auth.service.ts` bằng gọi API (nên dùng cookie httpOnly).
- Đọc phiên từ API (`/me`) thay cho storage trong `hydrateSession()`.
- Mọi quyết định phân quyền phải được server kiểm tra lại: lớp chặn ở UI chỉ để ẩn/hiện, không thay thế được bảo mật phía server.
