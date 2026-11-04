import { createStore } from "@/lib/store";

// Tham số nghiệp vụ dùng chung (GIẢ LẬP). Khi có backend, đề xuất lưu ở bảng `system_parameter`
// (param_key, param_value, data_type, param_group, description, updated_by, updated_at).
// Số mặc định lấy từ báo cáo đồ án, application.properties của backend và app mobile.

export type ParamGroup = "PAYMENT" | "AUTH" | "STUDENT" | "OPERATION" | "CONTENT";

export type SystemParam = {
  key: string;
  group: ParamGroup;
  label: string;
  description: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  /** WEB: web đang đọc tham số này. SERVER: chỉ có hiệu lực khi backend và app đọc từ CSDL. */
  appliesAt: "WEB" | "SERVER";
  updatedBy?: string;
  updatedAt?: string;
};

export const PARAM_GROUP_LABEL: Record<ParamGroup, string> = {
  PAYMENT: "Đặt vé & thanh toán",
  AUTH: "Đăng nhập & xác thực",
  STUDENT: "Xác nhận sinh viên",
  OPERATION: "Vận hành",
  CONTENT: "Sự cố & chatbot",
};

const param = (
  group: ParamGroup,
  key: string,
  label: string,
  description: string,
  value: number,
  unit: string,
  min: number,
  max: number,
  appliesAt: SystemParam["appliesAt"] = "SERVER",
): SystemParam => ({ group, key, label, description, value, unit, min, max, appliesAt });

export const DEFAULT_SYSTEM_PARAMS: SystemParam[] = [
  param(
    "PAYMENT",
    "payment.qrExpiryMinutes",
    "Hiệu lực mã QR thanh toán",
    "Quá thời gian này đơn hàng hết hạn thanh toán.",
    10,
    "phút",
    1,
    60,
  ),
  param(
    "AUTH",
    "auth.otpLifetimeMinutes",
    "Hiệu lực mã OTP",
    "Thời gian dùng được của mã xác thực gửi qua email.",
    10,
    "phút",
    1,
    60,
  ),
  param(
    "AUTH",
    "auth.otpResendCooldownSeconds",
    "Chờ gửi lại OTP",
    "Khoảng cách tối thiểu giữa hai lần gửi lại mã.",
    60,
    "giây",
    10,
    600,
  ),
  param(
    "AUTH",
    "auth.otpMaxFailedAttempts",
    "Số lần nhập sai OTP",
    "Vượt số lần này mã bị vô hiệu.",
    5,
    "lần",
    1,
    20,
  ),
  param(
    "AUTH",
    "auth.loginMaxFailures",
    "Số lần đăng nhập sai",
    "Vượt số lần này tài khoản bị khóa tạm thời.",
    10,
    "lần",
    3,
    50,
  ),
  param(
    "AUTH",
    "auth.loginLockMinutes",
    "Thời gian khóa đăng nhập",
    "Thời gian khóa sau khi đăng nhập sai quá số lần.",
    15,
    "phút",
    1,
    1440,
  ),
  param(
    "STUDENT",
    "student.autoApprovePercent",
    "Tự duyệt từ độ tin cậy",
    "Thấp hơn mức này thì hồ sơ chuyển Manager xem.",
    90,
    "%",
    1,
    100,
    "WEB",
  ),
  param(
    "STUDENT",
    "student.minReadablePercent",
    "Coi là đọc được từ",
    "Thấp hơn mức này thì yêu cầu hành khách chụp lại.",
    50,
    "%",
    1,
    100,
    "WEB",
  ),
  param(
    "STUDENT",
    "student.validityMonths",
    "Thời hạn xác nhận",
    "Không vượt quá hạn in trên thẻ.",
    12,
    "tháng",
    1,
    60,
    "WEB",
  ),
  param(
    "STUDENT",
    "student.renewWithinDays",
    "Nhắc gia hạn trước",
    "App nhắc gửi lại thẻ trước khi hết hạn.",
    30,
    "ngày",
    1,
    120,
    "WEB",
  ),
  param(
    "STUDENT",
    "student.reviewSlaHours",
    "Thời hạn xem hồ sơ",
    "Hồ sơ chờ quá thời gian này bị đánh dấu quá hạn.",
    24,
    "giờ",
    1,
    168,
    "WEB",
  ),
  param(
    "OPERATION",
    "ops.defaultDwellSeconds",
    "Thời gian dừng ga mặc định",
    "Gợi ý sẵn khi thêm ga vào tuyến.",
    30,
    "giây",
    5,
    300,
    "WEB",
  ),
  param(
    "OPERATION",
    "ops.defaultTurnaroundMinutes",
    "Thời gian quay đầu mặc định",
    "Gợi ý sẵn khi chưa có cấu hình vận hành.",
    4,
    "phút",
    1,
    60,
    "WEB",
  ),
  param(
    "CONTENT",
    "incident.maxPhotos",
    "Số ảnh tối đa mỗi báo cáo sự cố",
    "Nhân viên ga đính kèm khi báo sự cố trên app.",
    3,
    "ảnh",
    0,
    10,
  ),
  param(
    "CONTENT",
    "incident.maxDescriptionLength",
    "Độ dài mô tả sự cố",
    "Số ký tự tối đa của mô tả sự cố.",
    500,
    "ký tự",
    100,
    2000,
  ),
  param(
    "CONTENT",
    "chatbot.maxMessageLength",
    "Độ dài tin nhắn chatbot",
    "Số ký tự tối đa hành khách gửi một lần.",
    300,
    "ký tự",
    50,
    2000,
  ),
];

export const systemParamsStore = createStore<SystemParam[]>(DEFAULT_SYSTEM_PARAMS);

export function getParam(key: string) {
  const found = systemParamsStore.get().find((item) => item.key === key);
  if (!found) throw new Error(`Thiếu tham số hệ thống: ${key}`);
  return found.value;
}
