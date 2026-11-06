# Luồng yêu cầu hai chiều Admin ⇄ Manager

> Trạng thái: đã có trên UI, dữ liệu vẫn là mock trong bộ nhớ (tải lại trang là mất dữ liệu vừa tạo).
> Backend chưa có bảng hay API cho luồng này, xem mục [7. Việc cần làm ở backend](#7-việc-cần-làm-ở-backend).

## 1. Vấn đề

Trước đây hệ thống chỉ có **một chiều**: Admin đề xuất thay đổi dữ liệu, Manager phê duyệt hoặc từ chối.
Thực tế Manager cũng giao việc cho Admin (sửa bảng giá, thêm trường, sửa lỗi hiển thị, xuất báo cáo…),
và thường gửi qua tin nhắn, kèm file Excel/PDF/ảnh **ở ngoài hệ thống**. Kết quả là:

- không có lịch sử: ai yêu cầu, ai làm, đã xong chưa;
- Admin sửa dữ liệu theo tin nhắn nhưng Manager không kiểm tra được thay đổi thực tế;
- Admin không vào được Hộp phê duyệt nên không biết đề xuất của mình đã được duyệt hay chưa.

## 2. Hai loại yêu cầu

Hai chiều có bản chất khác nhau nên được tách thành hai loại, nhưng dùng chung **luồng trao đổi** và **tệp đính kèm**.

| | Đề xuất thay đổi (`A…`) | Yêu cầu công việc (`W…`) |
|---|---|---|
| Chiều | Admin → Manager | Manager → Admin |
| Nội dung | Có cấu trúc: trường, giá trị cũ → mới, dữ liệu để áp dụng | Tự do: tiêu đề, mô tả, nhóm, ưu tiên, hạn xử lý, tệp |
| Kết thúc | Phê duyệt / Từ chối | Hoàn thành / Không thực hiện |
| Ghi dữ liệu | Chỉ khi Manager phê duyệt (`applyApprovalDecision`) | Không bao giờ ghi trực tiếp |

## 3. Vòng đời của yêu cầu công việc

```
                ┌──────────── Admin: Không thực hiện (bắt buộc lý do) ────────────┐
                │                                                                  ▼
 Manager gửi ─▶ OPEN ──Admin nhận──▶ IN_PROGRESS ──Admin báo xong──▶ RESOLVED ──Manager xác nhận──▶ DONE
                                      │   ▲    ▲                         │
                    Admin hỏi lại     │   │    └──Manager mở lại─────────┘
                                      ▼   │ Manager trả lời trong luồng trao đổi
                                   NEEDS_INFO
                                                                         DECLINED ──Manager mở lại──▶ IN_PROGRESS
```

| Trạng thái | Nhãn | Đang chờ |
|---|---|---|
| `OPEN` | Mới | Admin |
| `IN_PROGRESS` | Đang xử lý | Admin, hoặc **Manager** nếu đang có đề xuất gắn kèm chờ duyệt |
| `NEEDS_INFO` | Cần bổ sung | Manager |
| `RESOLVED` | Chờ xác nhận | Manager |
| `DONE` | Hoàn thành | — |
| `DECLINED` | Không thực hiện | — |

Mỗi lần chuyển trạng thái đều ghi một dòng hệ thống vào luồng trao đổi, nên luồng trao đổi cũng là nhật ký của yêu cầu.

## 4. Nối hai chiều: việc cần sửa dữ liệu

Đây là điểm chính của thiết kế. **Admin không sửa dữ liệu trực tiếp theo yêu cầu của Manager**, mà vẫn phải đi qua đề xuất thay đổi:

1. Manager gửi `W4`: "Cập nhật giá gửi xe máy theo bảng giá mới" kèm `bang-gia.xlsx`.
2. Admin bấm **Nhận xử lý**, rồi **Mở Giá vé & gửi xe**. Hệ thống ghi nhớ "Admin đang xử lý W4".
   Trên mọi màn hình, Admin thấy một banner nhắc rằng đề xuất gửi lúc này sẽ tự gắn vào W4.
3. Admin sửa giá như bình thường. `submitApproval` thấy đang có yêu cầu được xử lý nên tự gắn
   `workRequestId = "W4"` vào đề xuất mới và ghi một dòng vào luồng trao đổi của W4.
4. Manager mở đề xuất và thấy dòng "Thực hiện theo yêu cầu **W4**", cùng bảng thay đổi thật.
   - **Phê duyệt**: dữ liệu được ghi, W4 tự chuyển sang `DONE` (nếu không còn đề xuất gắn kèm nào đang chờ).
     Không cần Manager xác nhận lần nữa, vì Manager đã xem đúng thay đổi khi duyệt.
   - **Từ chối**: W4 quay về `IN_PROGRESS` cho Admin, lý do từ chối được ghi vào luồng trao đổi.

Nhờ vậy:
- dữ liệu chỉ được ghi ở **một chỗ duy nhất** (`applyApprovalDecision`);
- người đề xuất và người duyệt luôn là hai người khác nhau;
- Manager kiểm tra được Admin làm có đúng ý mình không.

Việc **không** đụng tới dữ liệu (sửa lỗi, xuất báo cáo, việc làm ngoài hệ thống) thì Admin dùng **Báo hoàn thành**,
kèm ghi chú và tệp kết quả. Manager sau đó xác nhận, hoặc mở lại nếu chưa đạt.
Admin không thể báo hoàn thành khi còn đề xuất gắn kèm đang chờ duyệt.

## 5. Quy tắc

| Quy tắc | Nơi kiểm tra |
|---|---|
| Không ai tự duyệt đề xuất của chính mình | `applyApprovalDecision` + ẩn nút trong `ApprovalDetailSheet` |
| Không quyết định lại đề xuất đã có kết quả | `applyApprovalDecision` (đọc trạng thái mới nhất trong store) |
| Chỉ chuyển trạng thái theo đúng sơ đồ ở mục 3 | `work-requests.service.ts` (`update` với danh sách trạng thái hợp lệ) |
| Hỏi lại, từ chối, mở lại, báo hoàn thành đều phải có nội dung | các hàm trong `work-requests.service.ts` |
| Không trao đổi thêm khi yêu cầu đã `DONE` | `postMessage` |
| Tệp đính kèm: tối đa 5 tệp, mỗi tệp 20MB, chỉ PDF/Word/Excel/CSV/TXT/PNG/JPG | `toAttachments` |
| Yêu cầu kết thúc thì banner "đang xử lý" tự tắt | `update` |

Phân quyền thao tác (`src/lib/auth/permissions.ts`):

| Mã | Vai trò | Ý nghĩa |
|---|---|---|
| `/approvals` (route) | Admin, Manager | Hộp yêu cầu, nội dung tùy vai trò |
| `approval.decide` | Manager | Phê duyệt / từ chối đề xuất |
| `workRequest.create` | Manager | Gửi yêu cầu, xác nhận hoàn thành, mở lại |
| `workRequest.handle` | Admin | Nhận, hỏi lại, báo hoàn thành, không thực hiện |

> Đây chỉ là lớp chặn ở UI. Khi có API thật, backend phải kiểm tra lại toàn bộ.

## 6. Giao diện

Menu "Phê duyệt & chính sách" đổi thành **Hộp yêu cầu** (`/approvals`). Số trên menu là số việc **đang chờ người đang đăng nhập**.

**Manager**

| Tab | Nội dung |
|---|---|
| Cần tôi duyệt | Đề xuất của Admin. Có luồng trao đổi để hỏi lại trước khi quyết định, thay vì từ chối luôn |
| Yêu cầu gửi Admin | Nút **Gửi yêu cầu** (tiêu đề, nhóm, ưu tiên, hạn, mô tả, tệp). Lọc mặc định "Đang chờ tôi" |
| Chính sách đang áp dụng | Giữ nguyên như trước |

Trang Tổng quan của Manager có thêm thẻ "Yêu cầu gửi Admin": số yêu cầu Admin cần bổ sung thông tin, và số yêu cầu Admin đã báo xong đang chờ xác nhận.

**Admin**

| Tab | Nội dung |
|---|---|
| Việc từ Manager | Danh sách yêu cầu, mở chi tiết để nhận việc, đi tới màn hình cấu hình, hỏi lại, báo xong |
| Đề xuất đã gửi | Đề xuất của Admin và kết quả duyệt. Chỉ xem, không có nút duyệt. Vẫn trao đổi được khi đề xuất còn chờ |

Trang Tổng quan của Admin có thêm dòng "Yêu cầu từ Manager cần xử lý" trong mục "Việc còn tồn".

Link trực tiếp tới một yêu cầu: `/approvals?request=W4` hoặc `/approvals?tab=proposals&request=A2`.
Bấm vào đề xuất gắn kèm trong một yêu cầu (hoặc ngược lại) sẽ tự chuyển sang đúng tab.

## 7. Việc cần làm ở backend

UI đang dùng hai store (`approvalsStore`, `workRequestsStore`) và một store trao đổi chung (`threadsStore`)
để không phải sửa khoảng 20 chỗ đang gọi `submitApproval`. Ở backend nên **gộp thành một bảng**:

```sql
request          (id, kind CHANGE|WORK, type/category, title, description, priority, due_date,
                  status, created_by, handled_by, decided_by, reason/resolution,
                  payload JSONB, changes JSONB, parent_id → request.id, created_at, updated_at)
request_message  (id, request_id, author_id, body, is_system, created_at)
attachment       (id, request_id, message_id NULL, object_key, file_name, mime_type, size, uploaded_by, created_at)
```

- `parent_id` của một `CHANGE` trỏ tới `WORK` mà nó thực hiện (trên UI là `workRequestId`).
- **Tệp**: lưu trên MinIO (đã có trong `docker-compose.yml`). Client xin presigned URL để upload thẳng lên MinIO,
  rồi xác nhận lại với API. Backend kiểm tra loại file thật (magic bytes), không chỉ đuôi file.
- **Thông báo**: dùng `NotificationService` có sẵn (V8). Gửi thông báo khi có yêu cầu mới, khi chuyển trạng thái,
  và khi có tin nhắn mới cho bên đang được chờ. Chuông thông báo trên header đã tự hỏi lại server mỗi 30 giây.
- **Quyền mới**: `REQUEST_CREATE`, `CHANGE_APPROVE` (Manager), `WORK_HANDLE` (Admin).
  Backend phải kiểm tra người duyệt khác người tạo theo **user id**. UI hiện so theo tên vì dữ liệu mẫu chỉ có tên.
- **Áp dụng thay đổi**: chuyển `applyApprovalDecision` về backend và chạy trong cùng transaction với việc đổi trạng thái.
- API gợi ý:
  - `GET/POST /api/requests`
  - `POST /api/requests/{id}/transitions` với body `{ action, note }`
  - `GET/POST /api/requests/{id}/messages`
  - `POST /api/attachments/presign`

## 8. Giới hạn hiện tại

- Dữ liệu mock nằm trong bộ nhớ trình duyệt. Hai tài khoản đăng nhập ở hai trình duyệt **không thấy dữ liệu của nhau**,
  và tải lại trang sẽ mất dữ liệu vừa tạo. Muốn thử cả chuỗi Manager → Admin thì cần backend (mục 7).
  Hiện tại có thể thử từng phía trên dữ liệu mẫu W1–W4.
- Tệp đính kèm chỉ là object URL trong phiên làm việc. Tệp trong dữ liệu mẫu chỉ có tên, không tải được.
- Chưa có: Manager hủy yêu cầu đã gửi, nhắc khi quá hạn (SLA), giao yêu cầu cho một Admin cụ thể.
- Vai trò `MANAGER` ở backend (migration V10) đang có quyền `STATION_MANAGE`, chưa API nào dùng tới.
  Theo nguyên tắc ở mục 4 thì Manager không nên sửa dữ liệu trực tiếp, nên cần bỏ quyền này bằng một migration V11.

## 9. Tài khoản thử

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Manager | `manager.demo@metroticket.test` | `123456789` |
| Admin | `admin.demo@metroticket.test` | xem `seed/demo-users.json` ở backend |

Kịch bản thử:

1. Đăng nhập **Manager** → Hộp yêu cầu → Yêu cầu gửi Admin.
2. Mở **W3** (Cần bổ sung) và trả lời trong phần trao đổi: yêu cầu chuyển lại cho Admin.
3. Mở **W2** (Chờ xác nhận): bấm Xác nhận hoàn thành, hoặc Chưa đạt, mở lại.
4. Bấm **Gửi yêu cầu**, nhập nội dung và đính kèm một file Excel.
5. Đăng nhập **Admin** → Hộp yêu cầu → Việc từ Manager. Mở **W4**, bấm Nhận xử lý, rồi Mở Giá vé & gửi xe:
   banner "Đang xử lý yêu cầu W4" xuất hiện.
6. Sửa giá xe máy và gửi duyệt. Quay lại W4: đề xuất mới đã được gắn kèm, cột "Đang chờ" chuyển sang Manager.
7. Mở tab **Đề xuất đã gửi**: Admin chỉ xem và trao đổi, không có nút Phê duyệt.

## 10. File liên quan

| File | Vai trò |
|---|---|
| `src/mocks/requests.ts` | Kiểu dữ liệu và store: yêu cầu, luồng trao đổi, yêu cầu đang xử lý, dữ liệu mẫu W1–W4 |
| `src/mocks/admin.ts` | `Approval.workRequestId`; `submitApproval` tự gắn đề xuất vào yêu cầu đang xử lý |
| `src/pages/approvals/work-requests.service.ts` | Chuyển trạng thái, đang chờ ai, số trên menu, kiểm tra tệp, đồng bộ sau khi duyệt |
| `src/pages/approvals/approvals.service.ts` | Chặn tự duyệt và quyết định lại; gọi `syncAfterChangeDecision` |
| `src/pages/approvals/ApprovalsPage.tsx` | Các tab theo vai trò |
| `src/pages/approvals/components/*` | Danh sách, chi tiết, form gửi yêu cầu, luồng trao đổi, tệp đính kèm |
| `src/components/layout/ActiveWorkBanner.tsx` | Banner "đang xử lý yêu cầu" trên mọi màn hình của Admin |
| `src/lib/auth/permissions.ts` | `/approvals` mở cho cả hai vai trò; thêm 3 mã thao tác |
| `src/pages/approvals/work-requests.service.test.ts` | 10 test cho toàn bộ luồng |
