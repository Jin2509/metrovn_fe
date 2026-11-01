# Báo cáo nối API backend — Metro Web Admin

> Ngày thực hiện: 01/11/2026 · Phạm vi: web quản trị · Nguồn: tài liệu API dành cho frontend web và mobile

## 1. Tóm tắt

Web đã gọi backend thật cho đăng nhập, phiên làm việc, hồ sơ cá nhân, quản lý tài khoản, vai trò và quyền. Các trang vé, ga, tuyến, giao dịch, báo cáo vẫn dùng dữ liệu giả vì backend chưa có API.

**Đã chạy thử với backend thật** bằng trình duyệt headless: đăng nhập và xem dữ liệu đều đạt, các thao tác ghi chưa thử. Xem [mục 7](#7-kiểm-tra-đã-chạy).

## 2. Cách chạy

1. Chạy backend ở `http://localhost:8080`, hoặc đặt `VITE_API_BASE_URL` trong `.env`.
2. Chạy web bằng `pnpm dev` (cổng 3000, đã nằm trong CORS mặc định của backend).
3. Đăng nhập bằng tài khoản có vai trò `ADMIN`.
4. Xem log ở terminal chạy `pnpm dev`, dạng `[API] POST /api/auth/login → 200`. Log không chứa query, body hay token. Request đi thẳng từ trình duyệt sang backend, `server.forwardConsole` trong `vite.config.ts` chuyển log về terminal và chỉ có tác dụng khi chạy dev.

Backend có thể mất vài phút mới mở cổng 8080. Trong lúc đó web báo "Không thể kết nối tới máy chủ".

Để tài khoản Manager và Kế toán vào được web, cần tạo vai trò mã `MANAGER`, `ACCOUNTANT` ở trang **Vai trò & phân quyền**, rồi gán cho tài khoản ở trang **Tài khoản & phân công**. Backend mặc định chỉ có `PASSENGER`, `STAFF`, `ADMIN`.

## 3. Lớp API mới: `src/lib/api/`

| File | Nội dung |
|---|---|
| `client.ts` | `apiRequest`: gắn token, parse an toàn khi body rỗng, tự refresh khi gặp 401 |
| `errors.ts` | `ApiError` gồm `status`, `detail`, `fieldErrors`, `retryAfter`; `status = 0` là lỗi kết nối |
| `types.ts` | Kiểu dữ liệu request và response |
| `auth.api.ts` | Toàn bộ `/api/auth/*`, trừ refresh nằm trong `client.ts` |
| `me.api.ts` | Toàn bộ `/api/me/*` |
| `admin.api.ts` | Toàn bộ `/api/admin/users/*`, `/api/admin/roles/*`, `/api/admin/permissions` |

**Quy tắc của tài liệu đã áp dụng trong client:**

| Quy tắc | Cách làm |
|---|---|
| Chỉ một request refresh tại một thời điểm | Dùng chung một promise trong tab, Web Locks API giữa các tab |
| Tab khác vừa refresh | Sau khi có lock, đọc lại token. Token đã đổi thì dùng luôn, không gửi refresh |
| Gọi lại request chỉ 1 lần | Sau lần gọi lại, nếu vẫn 401 thì trả lỗi, không refresh tiếp |
| Refresh trả 401/403 | Xoá token, về màn đăng nhập |
| Refresh lỗi mạng/5xx | Giữ token, báo lỗi, chưa đăng xuất |
| 403 hoặc vừa refresh | Tải lại `GET /api/me` để cập nhật quyền |
| CORS | Chỉ gửi `Authorization`, `Content-Type`; không bật `credentials` |

## 4. Các màn hình đã nối

| Màn hình | Thay đổi |
|---|---|
| Đăng nhập | Gọi `login` rồi `GET /api/me`. Thông báo riêng cho sai thông tin, chưa xác thực, bị khoá, sai quá nhiều lần, mất kết nối. Đã bỏ khối tài khoản demo |
| Phiên làm việc | Lưu token, hạn phiên theo refresh token, tải lại `/api/me` khi mở app |
| Đăng xuất | Xoá token ở máy ngay, rồi gọi API thu hồi. Mất mạng vẫn đăng xuất |
| Hồ sơ | Đổi họ tên qua `PUT /api/me/profile`. Đổi mật khẩu xong phải đăng nhập lại |
| Tài khoản | Danh sách, tìm kiếm, lọc, tạo, khoá/mở, đặt lại mật khẩu, đổi vai trò |
| Vai trò & phân quyền | Bảng mới `BackendRolesPanel`: xem, tạo vai trò, đổi quyền. Vai trò `ADMIN` không sửa được, đúng theo backend |

## 5. Thay đổi hành vi cần biết

Các điểm này khác với bản giả lập, do backend không có hoặc làm khác:

| Trước đây | Hiện tại | Lý do |
|---|---|---|
| Tạo tài khoản phải chờ Manager duyệt | Tạo và kích hoạt ngay | `POST /api/admin/users` không có bước duyệt |
| Có ô số điện thoại trong hồ sơ | Đã bỏ | Backend không có field này |
| Có "Ga phụ trách" và "Lý do khóa" trong chi tiết tài khoản | Đã bỏ | Backend không có field này |
| Đặt lại mật khẩu dùng mật khẩu mặc định | Admin nhập mật khẩu mới | API bắt buộc `newPassword` |
| Trạng thái `INACTIVE` | `PENDING_VERIFICATION` (Chưa xác thực) | Theo backend |

Đã xoá `mocks/accounts.ts`, `DemoAccounts.tsx`, `login.constants.ts` và biến `VITE_SHOW_DEMO_ACCOUNTS`. Tài khoản demo không còn đăng nhập được.

## 6. Việc cần quyết định và hạn chế còn lại

**Cần quyết định:**

1. **Chặn màn hình vẫn theo tên vai trò.** Tài liệu khuyên dùng `permissions`, nhưng các màn hình như phê duyệt, chốt kỳ, chatbot chưa có quyền tương ứng ở backend. Vì vậy web chỉ nhận 3 mã `ADMIN`, `MANAGER`, `ACCOUNTANT`. Tài khoản có vai trò khác, kể cả vai trò tự tạo, không vào được web. Nên thống nhất với backend bộ quyền cho web rồi chuyển sang `permissions`. Session đã lưu sẵn `permissions` và có `useAuth().hasPermission()`.
2. **Refresh token đang nằm trong `localStorage` hoặc `sessionStorage`,** theo ô "Ghi nhớ đăng nhập". Tài liệu khuyên tránh `localStorage` vì XSS. Nếu bỏ thì người dùng phải đăng nhập lại khi mở tab mới.

**Đề xuất cho backend:**

| Đề xuất | Lý do |
|---|---|
| Thêm tham số `role` cho `GET /api/admin/users` | Hai tab Nhân sự và Hành khách cần lọc theo vai trò, nên web đang tải toàn bộ tài khoản rồi lọc ở client. Sẽ chậm khi có nhiều hành khách |
| Thêm lý do khoá tài khoản | Hộp thoại vẫn hỏi lý do, nhưng chỉ ghi vào nhật ký giả lập và mất khi tải lại trang |

**Hạn chế đã biết:**

- **Chưa có màn hình** cho quên mật khẩu, đăng ký, nhập OTP và đổi email. Hàm API đã có sẵn trong `authApi` và `meApi`. Vì thiếu màn OTP, login trả "Email chưa được xác thực" chỉ hiện thông báo, không chuyển màn như tài liệu gợi ý.
- **Vẫn dùng dữ liệu giả:** phân công ga, thông báo, thống kê ga, phê duyệt và các trang chưa có API. Danh sách người dùng ở các trang này (`usersStore`) không khớp với tài khoản thật.
- **Nhật ký hệ thống** đọc từ `GET /api/admin/auth-events`, nên chỉ có sự kiện bảo mật của tài khoản. Thao tác trên các trang dữ liệu giả vẫn gọi `logAction` nhưng chỉ nằm trong bộ nhớ trình duyệt và không còn hiển thị.
- **Tab nhân bản khi không chọn "Ghi nhớ":** nhân bản tab sẽ sao chép `sessionStorage`, nên hai tab giữ cùng một refresh token mà không thấy token mới của nhau. Khi cả hai cùng refresh, backend sẽ thu hồi phiên và người dùng phải đăng nhập lại.
- **Web Locks chỉ có trên https hoặc localhost.** Chạy qua `http://<IP LAN>` thì không phối hợp được giữa các tab.
- Web vẫn yêu cầu mật khẩu mới ở trang hồ sơ có cả chữ và số, chặt hơn backend. Hộp thoại admin đặt lại mật khẩu chỉ áp dụng giới hạn của backend.

## 7. Kiểm tra đã chạy

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | Không có lỗi |
| `pnpm test` | 16 file, 131 test đều đạt |
| `pnpm lint` | 0 lỗi, 9 cảnh báo |
| `pnpm build` | Thành công |

**Đã kiểm tra với backend thật** (Chromium headless, origin `http://localhost:3000`):

| Luồng | Kết quả |
|---|---|
| Đăng nhập sai | `401`, hiện "Email hoặc mật khẩu không đúng" |
| Đăng nhập `admin.demo` | `200`, gọi `GET /api/me` rồi vào trang chủ |
| Mở 11 trang: trang chủ, tài khoản, cài đặt, nhật ký, hồ sơ, thông báo, vé, ga, giao dịch, doanh thu, bản đồ | Các API đều trả `200`, không có lỗi JS |
| CORS | Cho phép origin cổng 3000, gồm header `Authorization` và `Content-Type` |

**Chưa kiểm tra:**

- Các thao tác ghi trên giao diện: hộp thoại tạo tài khoản, khoá/mở, đặt lại mật khẩu, bảng vai trò, đổi hồ sơ.
- Refresh token khi access token hết hạn và Web Locks giữa nhiều tab.

**Nên thử trước khi dùng:** đăng nhập → để access token hết hạn sau 15 phút → thao tác tiếp ở 2 tab, xem phiên có giữ được không → đăng xuất.
