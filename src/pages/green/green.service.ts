import {
  approvalsStore,
  hasPendingApproval,
  submitApproval,
  ticketTypesStore,
} from "@/mocks/admin";
import {
  greenConfigStore,
  STUDENT_ONLY_TICKET_ID,
  type GreenConfig,
  type GreenFactors,
  type GreenTier,
} from "@/mocks/green";

// Logic Hành trình xanh, bám theo app mobile. App và web phải cùng một công thức; khi có backend,
// backend là nơi áp giá thật còn hai bên chỉ hiển thị.

export const metroKgPerKm = (f: GreenFactors) => f.gridKgPerKwh * f.metroKwhPerKm;
export const motorbikeKgPerKm = (f: GreenFactors) =>
  (f.motorbikeLitrePer100Km / 100) * f.petrolKgPerLitre;
export const carKgPerKm = (f: GreenFactors) => f.carKgPerKm / f.peoplePerCar;

/** CO₂ bớt được khi đi Metro thay vì xe máy: phương tiện phổ biến nhất, cho kết quả thận trọng. */
export const savedKg = (km: number, f: GreenFactors) =>
  km * (motorbikeKgPerKm(f) - metroKgPerKm(f));

export const cpointOf = (kg: number, config: Pick<GreenConfig, "cpointPerKg">) =>
  Math.floor(kg * config.cpointPerKg);

/** Số ngày một cây xanh cần để hấp thụ lượng CO₂ này. */
export const treeDays = (kg: number, f: GreenFactors) => kg / (f.treeKgPerYear / 365);

export function tierOf(kg: number, tiers: GreenTier[]) {
  const index = tiers.reduce((found, tier, i) => (kg >= tier.fromKg ? i : found), 0);
  const tier = tiers[index];
  const next = tiers[index + 1] ?? null;
  return {
    tier,
    next,
    kgToNext: next ? next.fromKg - kg : 0,
    progress: next ? Math.min(1, (kg - tier.fromKg) / (next.fromKg - tier.fromKg)) : 1,
  };
}

export function validateGreenConfig(config: GreenConfig): string[] {
  const errors: string[] = [];
  const { factors, tiers, policy } = config;
  if (!(config.cpointPerKg > 0)) errors.push("Tỉ lệ quy đổi CPoint phải lớn hơn 0.");
  if (Object.values(factors).some((value) => !(value > 0)))
    errors.push("Mọi hệ số phát thải phải lớn hơn 0.");
  else if (motorbikeKgPerKm(factors) <= metroKgPerKm(factors))
    errors.push(
      "Phát thải xe máy phải cao hơn Metro, nếu không chuyến đi sẽ không có CO₂ để tính.",
    );
  if (tiers[0]?.fromKg !== 0) errors.push("Cấp đầu tiên phải bắt đầu từ 0 kg.");
  if (tiers.some((tier, i) => i > 0 && tier.fromKg <= tiers[i - 1].fromKg))
    errors.push("Mốc CO₂ phải tăng dần theo cấp.");
  if (tiers.some((tier, i) => i > 0 && tier.discountPercent < tiers[i - 1].discountPercent))
    errors.push("Cấp cao hơn không được có mức giảm thấp hơn cấp dưới.");
  const isPercent = (value: number) => value >= 0 && value <= 100;
  if (!tiers.every((tier) => isPercent(tier.discountPercent)) || !isPercent(policy.studentPercent))
    errors.push("Mức giảm phải từ 0 đến 100%.");
  if (!(policy.maxTotalPercent > 0 && policy.maxTotalPercent <= 100))
    errors.push("Tổng mức giảm tối đa phải từ 1 đến 100%.");
  return errors;
}

export type FareInput = {
  ticketTypeId: string;
  base: number;
  tier: GreenTier;
  isStudent: boolean;
  campaign?: { name: string; percent: number };
};

export type FarePreview =
  | { blocked: true; reason: string }
  | {
      blocked: false;
      lines: { label: string; percent: number; amount: number }[];
      total: number;
      capped: boolean;
    };

/**
 * Tính thử giá vé. Thứ tự giống mobile: ưu đãi sinh viên và chương trình trước, giảm theo cấp CPoint
 * tính trên phần còn lại. CPoint chỉ là thang ưu đãi, không bị trừ khi dùng.
 */
export function previewFare(input: FareInput, policy: GreenConfig["policy"]): FarePreview {
  const { ticketTypeId, base, tier, isStudent, campaign } = input;
  if (ticketTypeId === STUDENT_ONLY_TICKET_ID && !isStudent)
    return { blocked: true, reason: "Vé này chỉ bán cho người đã xác nhận sinh viên." };

  const offers: { label: string; percent: number }[] = [];
  if (isStudent && policy.studentTicketTypeIds.includes(ticketTypeId) && policy.studentPercent > 0)
    offers.push({ label: "Ưu đãi sinh viên", percent: policy.studentPercent });
  if (campaign) offers.push({ label: campaign.name, percent: campaign.percent });
  if (policy.tierTicketTypeIds.includes(ticketTypeId) && tier.discountPercent > 0)
    offers.push({ label: `Cấp ${tier.name}`, percent: tier.discountPercent });

  const applied =
    policy.combineMode === "BEST_ONLY" && offers.length > 1
      ? [offers.reduce((best, offer) => (offer.percent > best.percent ? offer : best))]
      : offers;

  let remaining = base;
  let budget = Math.floor((base * policy.maxTotalPercent) / 100);
  let capped = false;
  const lines = applied.map((offer) => {
    const wanted = Math.floor((remaining * offer.percent) / 100);
    const amount = Math.min(wanted, budget);
    if (amount < wanted) capped = true;
    remaining -= amount;
    budget -= amount;
    return { ...offer, amount };
  });
  return { blocked: false, lines, total: remaining, capped };
}

const percentText = (value: number) => `${value}%`;
const ticketNames = (ids: string[]) => {
  const names = ticketTypesStore
    .get()
    .filter((type) => ids.includes(type.id))
    .map((type) => type.name);
  return names.length ? names.join(", ") : "Không áp dụng";
};
const COMBINE_TEXT = {
  SEQUENTIAL: "Lần lượt trên phần còn lại",
  BEST_ONLY: "Chỉ lấy mức cao nhất",
};

/** Liệt kê cấu hình thành từng dòng để so sánh và hiển thị trong hộp phê duyệt. */
function describeConfig(config: GreenConfig) {
  const { factors: f, policy } = config;
  return [
    ["CPoint mỗi kg CO₂", String(config.cpointPerKg)],
    ["Lưới điện (kg CO₂/kWh)", String(f.gridKgPerKwh)],
    ["Điện năng Metro (kWh/km)", String(f.metroKwhPerKm)],
    ["Xe máy (lít/100 km)", String(f.motorbikeLitrePer100Km)],
    ["Xăng (kg CO₂/lít)", String(f.petrolKgPerLitre)],
    ["Ô tô (kg CO₂/km)", String(f.carKgPerKm)],
    ["Số người trên ô tô", String(f.peoplePerCar)],
    ["Cây xanh hấp thụ (kg/năm)", String(f.treeKgPerYear)],
    ...config.tiers.flatMap((tier) => [
      [`${tier.name}: mốc CO₂`, `${tier.fromKg} kg`],
      [`${tier.name}: mức giảm`, percentText(tier.discountPercent)],
    ]),
    ["Giảm theo cấp áp dụng cho", ticketNames(policy.tierTicketTypeIds)],
    ["Ưu đãi sinh viên", percentText(policy.studentPercent)],
    ["Ưu đãi sinh viên áp dụng cho", ticketNames(policy.studentTicketTypeIds)],
    ["Cách cộng ưu đãi", COMBINE_TEXT[policy.combineMode]],
    ["Tổng mức giảm tối đa", percentText(policy.maxTotalPercent)],
  ] as const;
}

export function diffGreenConfig(saved: GreenConfig, next: GreenConfig) {
  const after = describeConfig(next);
  return describeConfig(saved).flatMap(([field, old], i) =>
    old === after[i][1] ? [] : [{ field, old, new: after[i][1] }],
  );
}

export const GREEN_APPROVAL_TITLE = "Cấu hình Hành trình xanh";

/** Điểm và mức giảm ảnh hưởng trực tiếp tới giá vé nên phải qua Manager duyệt mới có hiệu lực. */
export function submitGreenConfig(next: GreenConfig): string | null {
  if (hasPendingApproval("GREEN_POLICY", () => true))
    return "Đang có một yêu cầu cấu hình chờ Manager duyệt.";
  const errors = validateGreenConfig(next);
  if (errors.length) return errors[0];
  const changes = diffGreenConfig(greenConfigStore.get(), next);
  if (!changes.length) return "Cấu hình chưa có gì thay đổi.";
  submitApproval("GREEN_POLICY", GREEN_APPROVAL_TITLE, changes, next);
  return null;
}

export function applyGreenConfig(payload: unknown) {
  greenConfigStore.set(() => payload as GreenConfig);
}

/** Yêu cầu cấu hình mới nhất, để màn hình biết đang chờ duyệt hay vừa bị từ chối. */
export const latestGreenApproval = (approvals = approvalsStore.get()) =>
  approvals.find((approval) => approval.type === "GREEN_POLICY");
