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
- Chưa có nút chuyển dark mode; token dark đã sẵn sàng, chỉ cần thêm `next-themes` (đã có trong dependencies) vào root.
