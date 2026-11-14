import { systemParamsApi, type SystemParamResponse } from "@/lib/api";

export const SYSTEM_PARAMS_KEY = ["system-params"] as const;

/** Nhãn tiếng Việt cho các mã backend đang dùng; mã lạ hiện mô tả của backend. */
export const PARAM_LABELS: Record<string, { label: string; unit: string }> = {
  CPOINT_PER_CHECKIN: { label: "CPoint mỗi lần check-in", unit: "điểm" },
  CPOINT_MAX_CHECKINS_PER_DAY: { label: "Số lần check-in tính điểm mỗi ngày", unit: "lần" },
  CPOINT_MAX_DISCOUNT_VND: { label: "Giảm giá tối đa bằng CPoint", unit: "VND" },
  PAYMENT_QR_TTL_MINUTES: { label: "Hiệu lực mã QR thanh toán", unit: "phút" },
  PARKING_OVERTIME_FEE_PER_HOUR: { label: "Phí gửi xe quá giờ", unit: "VND/giờ" },
  FARE_ROUNDING_VND: { label: "Bước làm tròn giá vé lượt", unit: "VND" },
  FARE_MIN_VND: { label: "Giá vé lượt tối thiểu", unit: "VND" },
};

export const paramLabel = (p: Pick<SystemParamResponse, "key" | "description">) =>
  PARAM_LABELS[p.key]?.label ??
  (p.key.startsWith("FARE_PER_KM_")
    ? `Đơn giá/km vé ${p.key.slice("FARE_PER_KM_".length)}`
    : (p.description ?? p.key));

export const paramUnit = (p: Pick<SystemParamResponse, "key">) =>
  PARAM_LABELS[p.key]?.unit ?? (p.key.startsWith("FARE_PER_KM_") ? "VND/km" : "");

/** Nhóm của backend → tiêu đề khối trên trang. */
export const groupLabel = (group: string) =>
  (
    ({
      LOYALTY: "Tích điểm CPoint",
      PAYMENT: "Thanh toán",
      PARKING: "Gửi xe",
      FARE: "Giá vé",
    }) as Record<string, string>
  )[group] ?? group;

export function validateParamValue(raw: string): string | null {
  if (raw.trim() === "") return "Vui lòng nhập giá trị";
  const value = Number(raw);
  if (!Number.isInteger(value)) return "Giá trị phải là số nguyên";
  if (value < 0) return "Giá trị không được âm";
  return null;
}

export const updateParam = (key: string, value: number, effectiveFrom?: string) =>
  systemParamsApi.update(key, { value, effectiveFrom });
