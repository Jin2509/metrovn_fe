import type { GreenSettings, MembershipTier } from "@/lib/api";

export const GREEN_KEY = ["green"] as const;
export const greenKeys = {
  settings: [...GREEN_KEY, "settings"] as const,
  stats: [...GREEN_KEY, "stats"] as const,
  leaderboard: (month: string) => [...GREEN_KEY, "leaderboard", month] as const,
  tiers: [...GREEN_KEY, "tiers"] as const,
};

export type GreenSettingsDraft = Omit<GreenSettings, "version" | "updatedAt">;

/** Trường số của cài đặt Hành trình xanh: [khóa, nhãn, gợi ý]. */
export const SETTING_FIELDS: [keyof GreenSettingsDraft, string, string][] = [
  ["baselineGramsPerKm", "CO₂ xe cá nhân (g/km)", "Mức phát thải dùng để so sánh"],
  ["metroGramsPerKm", "CO₂ Metro (g/km)", "Phát thải trên mỗi km đi Metro"],
  ["pointsPerKm", "Điểm xanh mỗi km", "Điểm cộng theo quãng đường đi Metro"],
  ["minTripMinutes", "Chuyến tối thiểu (phút)", "Chuyến ngắn hơn không được tính"],
  ["maxTripMinutes", "Chuyến tối đa (phút)", "Chuyến dài hơn coi là bất thường, không tính"],
  [
    "maxCountedTripsPerDay",
    "Số chuyến tính điểm mỗi ngày",
    "Chống cộng điểm bằng quẹt thẻ liên tục",
  ],
  ["treeGramsPerYear", "CO₂ một cây hấp thụ mỗi năm (g)", "Quy đổi CO₂ tiết kiệm ra số cây"],
];

export function validateSettings(d: GreenSettingsDraft): string[] {
  const errors: string[] = [];
  if (SETTING_FIELDS.some(([key]) => !Number.isFinite(d[key] as number) || (d[key] as number) < 0))
    errors.push("Các giá trị phải là số từ 0 trở lên.");
  if (d.metroGramsPerKm >= d.baselineGramsPerKm)
    errors.push("CO₂ của Metro phải thấp hơn xe cá nhân thì mới có CO₂ tiết kiệm.");
  if (d.minTripMinutes >= d.maxTripMinutes)
    errors.push("Chuyến tối thiểu phải ngắn hơn chuyến tối đa.");
  if (d.treeGramsPerYear <= 0) errors.push("CO₂ một cây hấp thụ phải lớn hơn 0.");
  return errors;
}

/** Thang hạng phải bắt đầu từ 0 và tăng dần. */
export function validateTiers(tiers: MembershipTier[]): string[] {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  const errors: string[] = [];
  if (sorted.some((t) => !t.name.trim())) errors.push("Tên hạng không được để trống.");
  if (sorted.some((t) => !Number.isInteger(t.minPoints) || t.minPoints < 0))
    errors.push("Mốc điểm phải là số nguyên từ 0 trở lên.");
  if (sorted.some((t, i) => i > 0 && t.minPoints === sorted[i - 1].minPoints))
    errors.push("Hai hạng không được có cùng mốc điểm.");
  return errors;
}

/** Tháng hiện tại dạng yyyy-MM theo giờ máy. */
export const currentMonth = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
