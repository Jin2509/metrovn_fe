# Báo cáo rà soát & tái cấu trúc giao diện — Metro Web Admin

> Ngày thực hiện: 26/10/2026 · Phạm vi: `metro_web_UI` (web quản trị cho Admin / Manager / Kế toán)

## 1. Tóm tắt

| Hạng mục | Trước | Sau |
|---|---|---|
| Số route (trang) | 25 (kể cả `/login`) | **15** |
| Mục trên menu | 23 | **13** |
| Nhóm menu | 7 | 7 (Chung, Mạng lưới, Kinh doanh, Điều hành, Tài chính, Giám sát, Hệ thống) |
| Tính năng của app hành khách nằm nhầm trong web | 2 (Tra cứu & chỉ đường, Chatbot) | 0 |
| Tài liệu mobile nằm nhầm trong repo web | `docs/mobile/` (2 file) | Đã chuyển sang repo Flutter |

## 2. Rà soát cấu trúc source

Cấu trúc hiện tại nhìn chung đã hợp lý và được giữ nguyên:

```
src/
├── components/        # Thành phần dùng chung
│   ├── auth/          # AuthGate, Can, RoleBadge, AccessDenied…
│   ├── layout/        # AppShell, Header, Sidebar, MobileNav, PageTabs, tab-search, nav.config
│   ├── ui/            # shadcn/ui
│   └── shared.tsx     # StatCard, Section, DataTable, StatusBadge, ReasonDialog
├── lib/               # auth/, geo, store, seo, error-*
├── mocks/             # Dữ liệu giả (thay bằng API sau)
├── pages/<tính-năng>/ # XxxPage.tsx | XxxPanel.tsx + components/ + hooks/ + *.service/types/constants
└── routes/            # File route mỏng: chỉ khai báo head/validateSearch và trỏ tới pages/
```

Các điểm lệch chuẩn đã sửa:

- `routes/index.tsx` và `routes/audit-logs.tsx` chứa toàn bộ giao diện ngay trong file route → tách ra `pages/dashboard/` và `pages/auditlogs/` như các trang khác.
- `public/robots.tsx` là file robots viết nhầm đuôi `.tsx` (toàn bộ nội dung bị comment) → thay bằng `public/robots.txt` chặn bot (`Disallow: /`), phù hợp với trang quản trị nội bộ.
- Trang 404 / trang lỗi đang dùng tiếng Anh → Việt hoá cho đồng bộ.

## 3. Loại bỏ file nhầm lẫn từ mobile

Web chỉ phục vụ 3 vai trò **Admin, Manager, Kế toán**. Hành khách và nhân viên soát vé dùng app Flutter (`../Project1_Metro_UI`). Repo Flutter đã có sẵn các màn hình tương ứng (`screens/search/route_detail_screen.dart`, `screens/map/search_map_screen.dart`, `screens/ai/compact_ai_chat_sheet.dart`), nên các phần sau trên web là trùng lặp và bị đặt nhầm:

| File | Lý do | Xử lý |
|---|---|---|
| `docs/mobile/01-MOBILE_UI_DESIGN.md`, `02-MOBILE_UI_FLOWS.md` | Tài liệu thiết kế UI Flutter cho Passenger / Staff | **Chuyển** sang `Project1_Metro_UI/docs/mobile/` (không xoá) |
| `src/routes/lookup.tsx` (~930 dòng) | "Tra cứu & chỉ đường": tìm địa điểm, tiện ích quanh ga, chỉ đường đi bộ/xe/Metro → use case UC5-03 của hành khách | Xoá |
| `src/components/explorer-map.tsx` | Bản đồ chỉ dùng cho trang tra cứu ở trên | Xoá |
| `src/mocks/network.ts` | Kho ga/tuyến riêng của trang tra cứu (tab "Thêm ga/tuyến" trùng chức năng với Ga & tuyến) | Xoá |
| `src/components/chatbot.tsx`, `src/lib/chatbot.ts` | Chatbot hỏi đáp ga/tuyến buýt cho hành khách, gắn nổi trên mọi trang admin | Xoá |
| `src/lib/geo.ts` (phần Nominatim/OSRM/Overpass, POI, chỉ đường) | Chỉ phục vụ trang tra cứu | Thu gọn, chỉ giữ `haversine` (đang dùng ở `lines.service.ts`) |

Giữ lại (không phải nhầm lẫn): `components/layout/MobileNav.tsx` và `hooks/use-mobile.tsx` — đây là menu/hook **responsive** cho web khi xem trên màn hình nhỏ, không phải mã của app mobile.

## 4. Gom các trang trùng / gần chức năng

Các chức năng liên quan được gom thành **tab trong cùng một trang** (component `PageTabs`). Tab đang mở được lưu trên URL (`?tab=`), nên vẫn có thể gửi link thẳng tới từng tab, ví dụ `/users?tab=assignments`.

| Trang mới | Route | Tab | Gộp từ (route cũ) | Quyền |
|---|---|---|---|---|
| Tổng quan | `/` | — | `/` | Tất cả |
| Bản đồ & xe buýt | `/map` | Bản đồ mạng lưới · Xe buýt kết nối | `/map`, `/buses` | Admin |
| Ga & tuyến | `/stations` | Danh sách ga · Tuyến & thứ tự ga | `/stations`, `/lines` | Admin |
| Tàu & vận hành | `/trains` | — | `/trains` | Admin |
| Giá vé & gửi xe | `/tickets` | Loại vé & giá vé · Gửi xe | `/tickets`, `/parking` | Admin |
| Ưu đãi & thành viên | `/promotions` | Khuyến mãi · Hạng thành viên | `/promotions`, `/membership-tiers` | Admin |
| Thông báo vận hành | `/notifications` | — | `/notifications` | Admin |
| Phê duyệt & chính sách | `/approvals` | Hộp phê duyệt · Chính sách đang áp dụng | `/approvals`, `/policies` | Manager |
| Giao dịch & đối soát | `/transactions` | Tra cứu giao dịch · Đối soát | `/transactions`, `/reconciliation` | Admin, Kế toán |
| Doanh thu | `/revenue` | — | `/revenue` | Tất cả (Manager chỉ xem) |
| Chốt kỳ | `/period-closing` | — | `/period-closing` | Kế toán |
| Thống kê vận hành | `/station-stats` | Theo ga · Lưu lượng theo giờ | `/station-stats`, `/passenger-flow` | Tất cả; tab "Lưu lượng theo giờ" chỉ Admin |
| Nhật ký hệ thống | `/audit-logs` | — | `/audit-logs` | Admin |
| Tài khoản & phân công | `/users` | Tài khoản · Phân công ga | `/users`, `/assignments` | Admin |
| Đăng nhập | `/login` | — | `/login` | Công khai |
| ~~Tra cứu & chỉ đường~~ | ~~`/lookup`~~ | — | Đã xoá (mục 3) | — |

Lý do gom:

- **Bản đồ + Xe buýt**: bản đồ hệ thống đã có lớp hiển thị xe buýt; danh sách tuyến buýt chỉ là góc nhìn chi tiết của cùng dữ liệu.
- **Ga + Tuyến**: thứ tự ga thuộc về tuyến; cùng là dữ liệu mạng lưới do Admin quản lý.
- **Vé + Gửi xe**: đều là bảng giá dịch vụ, cùng quy trình "chỉnh giá → gửi duyệt". Trang gửi xe trước đây có 3 tab con (bãi xe / sức chứa / bảng giá) → nay hiển thị trên một màn hình để tránh tab lồng tab.
- **Khuyến mãi + Hạng thành viên**: cùng nhóm ưu đãi cho khách hàng.
- **Phê duyệt + Chính sách**: chính sách đang áp dụng là kết quả của các yêu cầu đã duyệt, và trang chính sách vốn đã chứa "Lịch sử phê duyệt".
- **Giao dịch + Đối soát**: đối soát thao tác trên chính danh sách giao dịch, cùng nhóm quyền.
- **Thống kê theo ga + Lưu lượng**: trang thống kê theo ga đã gồm lưu lượng theo ga; lưu lượng theo khung giờ là phần chi tiết hơn của cùng chủ đề.
- **Người dùng + Phân công ga**: phân công là thao tác trên tài khoản nhân viên.

Cách tổ chức code khi gom: thư mục tính năng cũ được giữ nguyên; file trang bị gộp đổi tên `XxxPage.tsx` → `XxxPanel.tsx` (bỏ khung `AppShell`), trang chủ của nhóm import panel đó làm một tab. Ví dụ `pages/users/UsersPage.tsx` dùng `AssignmentsPanel` từ `pages/assignments`.

## 5. Hiện đại hoá giao diện

- **Header** dính trên cùng, nền mờ (backdrop blur), có breadcrumb `Metro Admin › <nhóm>`, tiêu đề và **mô tả ngắn** của từng trang (lấy từ `nav.config.ts`).
- **Sidebar**: logo gradient, mục đang chọn có thanh nhấn bên trái, hover mượt, nhóm menu mới "Hệ thống"; vẫn đánh dấu đúng mục khi đang ở tab con (`?tab=`).
- **Tab trang** kiểu gạch chân có icon — phân biệt rõ với các bộ lọc dạng "pill" bên trong trang.
- **Section** (thẻ nội dung): header có đường phân cách, hỗ trợ dòng mô tả và nút hành động. Nút "Tạo tài khoản", "Tạo khuyến mãi", "Lưu thay đổi"… chuyển từ header trang vào đúng thẻ mà nó tác động.
- **StatCard** có icon và tông màu (primary / accent / success / destructive / muted); áp dụng cho Tổng quan, Doanh thu, Thống kê theo ga, Lưu lượng.
- **DataTable**: khung viền bo góc, header nền nhạt chữ hoa nhỏ.
- **Tổng quan**: lời chào theo người dùng + badge vai trò, 4 thẻ KPI, biểu đồ tinh gọn (không lưới dọc, tooltip theo theme), khối **Truy cập nhanh** chỉ hiện các chức năng mà vai trò được dùng.
- **Design token** (`styles.css`): thêm `--shadow-card`, tinh chỉnh nền/viền; dark mode dùng lại màu thương hiệu (teal/cam) thay cho bảng màu slate mặc định; số dùng `tabular-nums` để bảng số thẳng cột; thanh cuộn mảnh.
- Nội dung giới hạn `max-width: 1600px` để không bị kéo giãn trên màn hình rất rộng.

## 6. Thay đổi phân quyền (`src/lib/auth/permissions.ts`)

- `ROUTE_ACCESS` chỉ còn 15 route thực tế; bỏ 9 route đã gộp / xoá.
- Thêm thao tác `stats.hourlyFlow` (chỉ Admin) trong `ACTION_ACCESS` để giữ nguyên quyền cũ của trang lưu lượng khi nó trở thành một tab trong trang dùng chung cho mọi vai trò.
- Cập nhật `permissions.test.ts` theo route mới và bổ sung test cho `stats.hourlyFlow`.

## 7. Kết quả kiểm tra

| Lệnh | Kết quả |
|---|---|
| `vite build` | ✅ Thành công — `routeTree.gen.ts` được sinh lại, còn đúng 15 route |
| `tsc --noEmit` | ✅ Không lỗi |
| `vitest run` | ✅ 6 file, 32/32 test đạt (gồm test phân quyền và test định tuyến menu ↔ route) |
| `eslint .` | ✅ 0 lỗi, 9 cảnh báo `react-refresh/only-export-components` có sẵn từ trước (`components/ui/*`, `shared.tsx`, `app-shell.tsx`) |

Đã sửa thêm 1 lỗi lint có sẵn từ trước (định dạng Prettier trong `eslint.config.js`).

> ⚠️ **Vì sao các lệnh bị "treo" trên máy:** thư mục `~/Documents` đang được đồng bộ bằng iCloud Drive (Desktop & Documents, bật "Tối ưu hoá dung lượng Mac"). Mỗi lần mở file trong đó mất khoảng 0,36 giây (đọc 200 file mất 72 giây, so với 0,2 giây ở ngoài iCloud). `tsc`/`vite` phải đọc hàng nghìn file trong `node_modules` nên gần như đứng yên. Các kiểm tra ở trên được chạy trên bản sao mã nguồn đặt ngoài iCloud (cài lại dependency từ pnpm store với `--offline --frozen-lockfile`).
> **Khuyến nghị:** chuyển dự án ra ngoài iCloud (ví dụ `~/dev/metro_web_UI`), hoặc tắt đồng bộ cho thư mục này.

## 8. Lưu ý & việc nên làm tiếp

- **URL cũ** (`/buses`, `/lines`, `/parking`, `/membership-tiers`, `/policies`, `/reconciliation`, `/passenger-flow`, `/assignments`, `/lookup`) nay trả về trang 404 (đã Việt hoá, có hướng dẫn dùng menu). Nếu đã chia sẻ link cũ, có thể thêm route chuyển hướng tới `/<trang mới>?tab=…`.
- Trang **Chính sách đang áp dụng** vẫn có bộ bảng chỉ xem riêng (`pages/policies/components/*`) song song với bảng chỉnh sửa ở Giá vé & gửi xe / Hạng thành viên. Có thể hợp nhất thành một bảng có chế độ `readonly` khi nối API.
- `.node_modules_broken/` (thư mục `node_modules` hỏng, đã bị `.gitignore`) vẫn còn trên máy — nên xoá thủ công để giải phóng dung lượng.
- `.output/` là bản build cũ (đã `.gitignore`), sẽ được tạo lại khi `pnpm build`.
- ~~Chưa có nút chuyển dark mode~~ → đã thêm ở trang Cài đặt tài khoản.

## 9. Đối chiếu UI với báo cáo đồ án và cơ sở dữ liệu (28/10/2026)

**Nguyên tắc:** mọi màn hình phải ứng với một use case trong báo cáo `24521574_24521562_BaoCao_DoAn1` (mục 3.2.3), mọi trường và mọi con số phải lấy được từ một bảng trong mục 3.3.2. Chức năng hoặc thống kê không có căn cứ thì không đưa lên UI. Kế hoạch màn hình bám theo `KeHoach_UI_NextJS_Metro_Admin` (ADM-xx, MGR-xx, ACC-xx).

### 9.1 Màn hình ↔ use case ↔ bảng dữ liệu

| Màn hình | Use case / mã màn hình | Bảng dữ liệu |
|---|---|---|
| Ga & tuyến → Danh sách ga | UC4, ADM-06: thêm/sửa ga, chọn tọa độ trên bản đồ, cờ chuyển tuyến, trạng thái | `station` (code, name_station, latitude, longitude, address, district, is_interchange, status ACTIVE/INACTIVE/MAINTENANCE), `staff_station` |
| Ga & tuyến → Tuyến & thứ tự ga | UC4-01, ADM-07: kéo thả/nhập thứ tự, lưu toàn bộ hoặc không, lỗi “Thứ tự ga không hợp lệ” | `line_station` (station_order, distance_from_prev_km, travel_time_from_prev_seconds, dwell_time_seconds), `ticket_price` |
| Bản đồ hệ thống | UC5, ADM-08, mục tiêu “theo dõi vị trí tàu được mô phỏng” (1.4.2.1) | `station`, `line_station`, `operation_config`, `announcement` |
| Tàu & vận hành | ADM-09: đoàn tàu, cấu hình vận hành theo phiên bản, Manager duyệt | `train` (status READY/IN_OPERATION/MAINTENANCE/OUT_OF_SERVICE), `operation_config` (number_of_trains, headway_minutes, running_time_minutes, turnaround_time_minutes, start/end_time, effective_from/to, status DRAFT → PENDING_APPROVAL → APPROVED → ACTIVE → INACTIVE) |
| Thông báo vận hành | UC13-04, ADM-15: tiêu đề, nội dung, nhóm nhận (hành khách / nhân viên nhà ga / kế toán / tất cả), lịch sử | `announcement` (line_id, station_id, severity, starts_at, ends_at, status), `notification` (channel IN_APP/PUSH/EMAIL, status PENDING/SENT/FAILED, is_read) |
| Chatbot hỗ trợ | UC14-01/02/03 (chatbot chỉ tra cứu) | `chatbot_session`, `chatbot_message`, `chatbot_faq` |
| Vai trò & phân quyền | UC2, quản lý phân quyền | `role`, `functions`, `permission`; backend: `/api/admin/roles`, `/api/admin/permissions` |
| Cài đặt tài khoản | AUTH-05: xem, sửa trường được phép, đổi mật khẩu | `users` (fullname, numberphone) |

### 9.2 Những gì đã gỡ vì không có căn cứ

| Đã gỡ | Lý do |
|---|---|
| Chatbot “chuyển nhân viên”, hàng đợi hội thoại chờ người, thời gian chờ nhân viên | UC14 không có luồng chuyển người; `chatbot_message.sender` chỉ có USER/BOT |
| Chỉ số “giải quyết thật”, chấm điểm QA, chi phí token, CSAT 1–5, mua vé/hoàn vé trong chat | Không có cột nào lưu các giá trị này; feedback chỉ có LIKE/DISLIKE |
| Trang cấu hình bot (mô hình, độ sáng tạo, phiên bản cấu hình chờ duyệt) | Không có bảng cấu hình chatbot trong CSDL |
| Sự cố có diễn biến, thiết bị ga (thang máy, cổng…), lối vào, mức đông % | Không có bảng tương ứng; thông tin sự cố/đóng ga đi qua bảng `announcement` (UC13-04) |
| Ước tính người nhận theo hệ số, tỉ lệ mở/bấm/tắt nhận, giờ yên lặng, giới hạn tần suất, SMS, banner | `notification` chỉ ghi trạng thái gửi và đã đọc; UC13-04 gửi theo nhóm người dùng |
| Cấu hình đặt vé & thanh toán (số vé/đơn, chu kỳ QR, bật/tắt cổng, bảo trì app) | Không có use case và bảng tham số tương ứng |
| Mô hình 3D tuyến (cao độ ngầm/trên cao) | Kết cấu công trình không có trong CSDL |
| Thẻ “Gợi ý AI” trên bản đồ | Đoạn chữ cố định, không có dữ liệu phía sau |

### 9.3 Thống kê còn lại và nguồn số liệu

| Số liệu | Cách tính | Nguồn |
|---|---|---|
| Chatbot: phiên, câu hỏi | Đếm dòng | `chatbot_session`, `chatbot_message` (sender = USER) |
| Chatbot: nhận diện được câu hỏi | Tin BOT có `intent` ≠ null ÷ tổng tin BOT | `chatbot_message.intent` |
| Chatbot: thời gian phản hồi | Trung bình, p95, % ≤ 3 giây (yêu cầu phi chức năng UC14) | `chatbot_message.response_time_ms` |
| Chatbot: hài lòng | LIKE ÷ (LIKE + DISLIKE), kèm tỉ lệ câu trả lời được đánh giá | `chatbot_message.feedback` |
| Chatbot: câu hỏi chưa nhận diện được → “Thêm vào kho tri thức” | Câu hỏi USER đứng trước tin BOT có intent = null | `chatbot_message` → `chatbot_faq` |
| FAQ: lượt dùng | Số tin BOT trả lời bằng FAQ đó | `chatbot_message.action_called`, `response_data` |
| Thông báo: người nhận | Tài khoản đang hoạt động thuộc nhóm nhận | `users.status`, vai trò |
| Thông báo: gửi thành công/lỗi, đã đọc | Đếm dòng theo trạng thái | `notification.status`, `is_read` |
| Số đoàn tàu tối thiểu | ⌈(2 × running_time + 2 × turnaround) ÷ headway⌉ | `operation_config` |
| Đoàn tàu khả dụng | Tàu READY hoặc IN_OPERATION của tuyến | `train.status` |
| Thời gian chạy một chiều | Σ travel_time_from_prev + Σ dwell_time | `line_station` |
| Giá vé lượt giữa hai ga | Bậc giá theo hiệu lý trình | `line_station.distance_from_prev_km`, `ticket_price` |
| Vị trí tàu (mô phỏng) | Chuyến xuất phát mỗi headway từ start_time; nội suy vị trí theo thời gian chạy và dừng | `operation_config`, `line_station` |

Cách đo chatbot tham khảo bảng phân tích hội thoại của các nền tảng chatbot phổ biến (số phiên, tỉ lệ không khớp ý định, phân bố ý định, thời gian phản hồi, phản hồi người dùng). Thông báo vận hành gắn tuyến/ga, mức độ và khoảng thời gian hiệu lực tương tự cấu trúc “service alert” (đối tượng bị ảnh hưởng, mức độ, thời gian hiệu lực) của chuẩn GTFS-Realtime mà các hệ thống giao thông công cộng dùng.

### 9.4 Lưu ý khi nối backend

- Backend hiện seed 3 vai trò `PASSENGER`, `STAFF`, `ADMIN`; web dùng `ADMIN`, `MANAGER`, `ACCOUNTANT` theo báo cáo. Cần tạo thêm `MANAGER`, `ACCOUNTANT` qua API `POST /api/admin/roles` (đã có) hoặc migration.
- Trạng thái tài khoản: backend dùng `PENDING_VERIFICATION/ACTIVE/LOCKED`, bảng `users` trong báo cáo dùng `ACTIVE/INACTIVE/LOCKED` — cần thống nhất.
- Vị trí tàu mô phỏng đang tính ở client; khi có backend nên tính ở server và đẩy qua WebSocket (mục 2.1.4 báo cáo), giao diện chỉ đổi nguồn dữ liệu.

### 9.5 Kiểm tra

`tsc` không lỗi · `vitest` 13 file, 71 test đạt (thêm test cho ga/tuyến, cấu hình vận hành, mô phỏng tàu, thông báo vận hành, thống kê chatbot) · `eslint` 0 lỗi, 9 cảnh báo có sẵn · `vite build` thành công · chụp màn hình mọi trang đã sửa với 3 vai trò và khổ điện thoại: không lỗi console, không tràn ngang · chạy thử trên trình duyệt luồng “trang ga → tạo thông báo cho ga (điền sẵn tuyến/ga) → gửi → hiện trong lịch sử và trên bản đồ”.

Test bắt được một lỗi múi giờ: dùng `toISOString()` (giờ UTC) để lấy ngày khiến bộ lọc “7 ngày” và ngày hiệu lực cấu hình vận hành lệch một ngày trước 7 giờ sáng; đã đổi sang định dạng theo giờ máy.

## 10. Luồng phê duyệt Ga/Tuyến, xóa có thông báo, đối soát chỉ Kế toán (27/10/2026)

### 10.1 Yêu cầu

1. Admin không được tự ý đổi dữ liệu **tàu, nhà ga, tuyến đường** — mọi thay đổi phải do **Manager quyết định và phê duyệt** mới có hiệu lực.
2. **Xóa** một đối tượng phải hiển thị thông báo (xác nhận trước khi xóa, và báo kết quả sau khi gửi).
3. **Đối soát** là nghiệp vụ của **Kế toán**; Admin chỉ được xem.
4. Rà soát lại tính thực tế của UI, cắt các chức năng vượt phạm vi đồ án sinh viên.

### 10.2 Hiện trạng trước khi sửa

Rà soát cho thấy hệ thống **đã có sẵn** một cơ chế phê duyệt dùng chung (`approvalsStore`, `submitApproval`, trang **Phê duyệt & chính sách** chỉ Manager mới vào được) và **đã áp dụng đúng** cho giá vé, giá gửi xe, khuyến mãi và **cấu hình vận hành tàu** (`trains.service.ts`: Nháp → Gửi duyệt → Manager duyệt → áp dụng theo ngày hiệu lực) — nghĩa là phần "vận hành tàu" (số đoàn tàu chạy, giãn cách, giờ vận hành) **đã đúng yêu cầu từ trước**, không cần sửa.

Hai chỗ **chưa đúng** yêu cầu (Admin ghi thẳng vào dữ liệu, không qua ai duyệt):

- **Ga** (`pages/stations`): thêm/sửa ga gọi `saveStation()` ghi thẳng vào `stationsStore`. **Không có chức năng xóa ga.**
- **Tuyến** (`pages/lines`): sửa thứ tự ga/lý trình (ảnh hưởng trực tiếp đến giá vé lượt và tra cứu lộ trình) gọi `saveLineOrder()` ghi thẳng, không qua duyệt.
- **Đối soát** (`pages/reconciliation`): route `/transactions` cho cả Admin và Kế toán (nhóm quyền `FINANCE`), và cả hai đều bấm được nút "Xác nhận đã đối soát" — không có phân biệt "chỉ xem" cho Admin.

### 10.3 Thay đổi — Ga & Tuyến: thêm 2 loại phê duyệt mới (`STATION`, `LINE`)

Mở rộng đúng cơ chế đã có (không tạo luồng riêng):

- `src/mocks/admin.ts`: thêm `ApprovalType` `"STATION"` ("Nhà ga") và `"LINE"` ("Tuyến đường"); thêm trường `payload?: unknown` vào `Approval` để mang dữ liệu cần ghi khi được duyệt; thêm `hasPendingApproval()` để chặn gửi trùng yêu cầu cho cùng một ga/tuyến.
- `src/lib/network.ts`: tách rõ 2 lớp hàm —
  - **`request*`** (Admin gọi từ màn hình): `requestStationUpsert`, `requestStationDelete`, `requestLineOrderChange` — chỉ tạo bản ghi `Approval` (kèm bảng so sánh giá trị cũ/mới), **không đụng tới `stationsStore`/`lineStationsStore`**.
  - **`apply*`** (chỉ gọi sau khi Manager bấm "Phê duyệt"): `applyStationApproval`, `applyLineOrderApproval` — đây mới là nơi thật sự gọi `saveStation`/`saveLineOrder` để ghi dữ liệu.
  - `requestStationDelete` chặn xóa nếu ga vẫn thuộc một tuyến (`lineIds.length > 0`) — tránh phá vỡ lý trình/giá vé đang tham chiếu ga đó; thông báo rõ phải gỡ khỏi tuyến trước.
- `src/pages/approvals/approvals.service.ts`: `applyApprovalDecision` gọi `applyStationApproval`/`applyLineOrderApproval` khi loại là `STATION`/`LINE` **và** quyết định là `APPROVED`. Từ chối thì không có gì thay đổi trong hệ thống — đúng yêu cầu "phải được duyệt mới được phép thay đổi".
- Trang **Phê duyệt & chính sách** không cần sửa gì thêm: tab loại yêu cầu, bảng so sánh cũ/mới, nút Duyệt/Từ chối đều tự sinh từ `approvalLabel`/`Approval.changes` nên 2 loại mới hiện ra ngay.

**Màn hình Ga** (`pages/stations`): nút "Thêm ga"/"Sửa thông tin" đổi thành gửi yêu cầu (nút "Gửi duyệt", mô tả rõ "chỉ thay đổi sau khi được phê duyệt"); thêm nút **"Xóa ga"** ở trang chi tiết ga. Có banner "Có N yêu cầu đang chờ Manager phê duyệt" khi còn yêu cầu PENDING.

**Màn hình Tuyến** (`pages/lines`): nút "Lưu thứ tự" đổi tên thành **"Gửi duyệt"**; vì dữ liệu chưa ghi vào kho, bảng vẫn hiển thị đúng trạng thái "đang có thay đổi chưa áp dụng" (nút Hoàn tác) cho tới khi Manager duyệt. Có banner cảnh báo khi tuyến đang có yêu cầu chờ duyệt.

### 10.4 Thay đổi — Xóa phải có thông báo

Tái dùng component `ReasonDialog` đã có sẵn (trước đây chỉ dùng cho "Từ chối yêu cầu" ở trang Phê duyệt): bấm "Xóa ga" → hộp thoại bắt buộc nhập lý do xóa → xác nhận mới gửi yêu cầu (không xóa ngay) → toast báo "Đã gửi yêu cầu xóa ga … tới Manager để phê duyệt". Lý do xóa được đưa vào bảng so sánh của yêu cầu để Manager đọc khi duyệt.

### 10.5 Thay đổi — Đối soát: Kế toán thao tác, Admin chỉ xem

- `src/lib/auth/permissions.ts`: thêm thao tác `"reconciliation.confirm"` trong `ACTION_ACCESS`, chỉ cấp cho `ACCOUNTANT` (route `/transactions` vẫn mở cho cả Admin và Kế toán như cũ, để Admin xem được).
- `pages/reconciliation`: khi không có quyền `reconciliation.confirm` (tức Admin) — ẩn hẳn ô chọn, nút "Xác nhận đã đối soát" và "Chọn tất cả"; bảng giao dịch chuyển về chế độ chỉ đọc (bỏ cột tick chọn); hiện khối cảnh báo "Admin chỉ xem … Kế toán thực hiện đối soát".
- Mục này tự hiện trong bảng **Vai trò & phân quyền** ở trang Cài đặt (bảng này sinh trực tiếp từ `ACTION_ACCESS`, không cần sửa riêng).

### 10.6 Quyết định có cân nhắc: không bắt duyệt việc đổi trạng thái từng đoàn tàu

Mục "Đoàn tàu" trong trang Tàu & vận hành (`TrainFleetSection.tsx`) cho đổi trạng thái một đoàn tàu (Sẵn sàng/Đang chạy/Bảo dưỡng/Ngừng sử dụng) ngay lập tức, **không qua Manager**. Cân nhắc giữ nguyên vì:

- Đây là hành động điều hành/an toàn tức thời (tàu hỏng phải dừng ngay), không phải thay đổi cấu hình — khác với số đoàn tàu/giãn cách/giờ chạy (đã qua Manager từ trước, xem 10.2).
- Nếu bắt duyệt cả việc này thì khi có sự cố, nhân viên phải chờ Manager mới được dừng tàu — không thực tế và có thể ảnh hưởng an toàn.

Nếu người dùng muốn bắt buyệt cả bước này (ví dụ chỉ coi "Ngừng sử dụng" hẳn mới cần duyệt, còn Bảo dưỡng/Sẵn sàng/Đang chạy thì không), có thể làm thêm theo đúng khuôn `request*`/`apply*` đã dựng ở trên.

### 10.7 Rà soát phạm vi UI (tính thực tế cho đồ án sinh viên)

Mục 9.2 (báo cáo trước) đã rà soát và gỡ các chức năng không có cơ sở triển khai (chuyển người trong chatbot, chấm điểm QA/CSAT, trang cấu hình AI, mô hình 3D tuyến, "Gợi ý AI" trên bản đồ…). Lần này rà soát lại toàn bộ các trang còn lại (tìm từ khoá dự đoán/AI gợi ý/tối ưu hoá tự động/nhận diện/bất thường…) thì **không phát hiện thêm chức năng vượt phạm vi** — các trang còn lại (xe buýt kết nối, bãi xe, hạng thành viên, khuyến mãi, thống kê ga/lưu lượng, nhật ký hệ thống…) đều là hiển thị/CRUD đơn giản, có cơ sở dữ liệu tương ứng, không yêu cầu hạ tầng AI/thời gian thực phức tạp. Không cắt thêm trang nào trong lần này.

### 10.8 Kiểm tra

| Lệnh | Kết quả |
|---|---|
| `tsc --noEmit` | ✅ Không lỗi |
| `eslint .` | ✅ 0 lỗi, 9 cảnh báo có sẵn (không đổi) |
| `vitest run` | ✅ 13 file, **81/81** test đạt (thêm 10 test cho `requestStationUpsert`/`requestStationDelete`/`applyStationApproval`/`requestLineOrderChange`/`applyLineOrderApproval`) |
| `vite build --mode development` | ✅ Thành công |

### 10.9 Việc nên làm tiếp (nếu cần)

- Cân nhắc bắt duyệt cả việc đổi trạng thái đoàn tàu sang "Ngừng sử dụng" (xem 10.6) nếu muốn khít 100% với yêu cầu "mọi thay đổi đối tượng tàu đều phải duyệt".
- Admin hiện không vào được trang Phê duyệt (đúng thiết kế phân quyền từ trước) nên chỉ biết yêu cầu Ga/Tuyến của mình đang "chờ" qua banner trên chính trang Ga/Tuyến, không thấy được lịch sử Từ chối kèm lý do — nếu cần, có thể thêm một bảng "Yêu cầu của tôi" chỉ đọc cho Admin.
- Khi nối backend thật: 2 loại phê duyệt mới (`STATION`, `LINE`) cần bảng lưu kèm (hiện `payload` nằm trong chính bảng `approval`/`Approval`), nên thiết kế cột `payload` dạng JSON hoặc bảng phụ tương ứng ở CSDL thật.
