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
  type GreenTier,
} from "@/mocks/green";
import type { LoyaltyMember } from "@/mocks/loyalty";

// Logic Hành trình xanh. Mỗi lần check-in hợp lệ tại ga được cộng đúng số điểm của loại vé đang dùng.
// Mua vé không được cộng điểm. Khi có backend, backend là nơi cộng điểm và áp giá thật.

/** Điểm cộng cho một lần check-in. Loại vé chưa khai báo được 0 điểm. */
export const pointsPerCheckin = (
  ticketTypeId: string,
  config: Pick<GreenConfig, "checkinPoints">,
) => config.checkinPoints[ticketTypeId] ?? 0;

export const cpointForCheckins = (
  ticketTypeId: string,
  checkins: number,
  config: Pick<GreenConfig, "checkinPoints">,
) => pointsPerCheckin(ticketTypeId, config) * checkins;

export function tierOf(cpoint: number, tiers: GreenTier[]) {
  const index = tiers.reduce((found, tier, i) => (cpoint >= tier.fromCpoint ? i : found), 0);
  const tier = tiers[index];
  const next = tiers[index + 1] ?? null;
  return { tier, next, cpointToNext: next ? next.fromCpoint - cpoint : 0 };
}

export const TOP_MEMBERS = 10;

/** Thành viên nhiều CPoint nhất, kèm cấp hiện tại theo thang đang áp dụng. */
export function topMembers(members: LoyaltyMember[], tiers: GreenTier[], limit = TOP_MEMBERS) {
  return [...members]
    .sort((a, b) => b.cpoint - a.cpoint)
    .slice(0, limit)
    .map((member, index) => ({
      ...member,
      rank: index + 1,
      tier: tierOf(member.cpoint, tiers).tier,
    }));
}

/** Che bớt email để bảng xếp hạng không lộ thông tin cá nhân. */
export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

export function validateGreenConfig(config: GreenConfig): string[] {
  const errors: string[] = [];
  const { tiers, policy } = config;
  if (Object.values(config.checkinPoints).some((point) => !Number.isInteger(point) || point < 0))
    errors.push("Điểm mỗi lần check-in phải là số nguyên từ 0 trở lên.");
  if (tiers[0]?.fromCpoint !== 0) errors.push("Cấp đầu tiên phải bắt đầu từ 0 CPoint.");
  if (tiers.some((tier, i) => i > 0 && tier.fromCpoint <= tiers[i - 1].fromCpoint))
    errors.push("Mốc CPoint phải tăng dần theo cấp.");
  if (tiers.some((tier, i) => i > 0 && tier.discountPercent < tiers[i - 1].discountPercent))
    errors.push("Cấp cao hơn không được có mức giảm thấp hơn cấp dưới.");
  const isPercent = (value: number) => value >= 0 && value <= 100;
  if (!tiers.every((tier) => isPercent(tier.discountPercent)) || !isPercent(policy.studentPercent))
    errors.push("Mức giảm phải từ 0 đến 100%.");
  return errors;
}

export type FareInput = {
  ticketTypeId: string;
  base: number;
  tier: GreenTier;
  isStudent: boolean;
};

export type FarePreview =
  | { blocked: true; reason: string }
  | { blocked: false; lines: { label: string; percent: number; amount: number }[]; total: number };

/**
 * Tính thử giá vé. Thứ tự giống mobile: chính sách sinh viên giảm trước, cấp CPoint giảm trên phần còn lại.
 * CPoint chỉ là thang ưu đãi, không bị trừ khi dùng.
 */
export function previewFare(input: FareInput, policy: GreenConfig["policy"]): FarePreview {
  const { ticketTypeId, base, tier, isStudent } = input;
  if (ticketTypeId === STUDENT_ONLY_TICKET_ID && !isStudent)
    return { blocked: true, reason: "Vé này chỉ bán cho người đã xác nhận sinh viên." };

  const offers: { label: string; percent: number }[] = [];
  if (isStudent && policy.studentTicketTypeIds.includes(ticketTypeId) && policy.studentPercent > 0)
    offers.push({ label: "Chính sách sinh viên", percent: policy.studentPercent });
  if (policy.tierTicketTypeIds.includes(ticketTypeId) && tier.discountPercent > 0)
    offers.push({ label: `Cấp ${tier.name}`, percent: tier.discountPercent });

  let remaining = base;
  const lines = offers.map((offer) => {
    const amount = Math.floor((remaining * offer.percent) / 100);
    remaining -= amount;
    return { ...offer, amount };
  });
  return { blocked: false, lines, total: remaining };
}

const percentText = (value: number) => `${value}%`;
const ticketNames = (ids: string[]) => {
  const names = ticketTypesStore
    .get()
    .filter((type) => ids.includes(type.id))
    .map((type) => type.name);
  return names.length ? names.join(", ") : "Không áp dụng";
};

/** Liệt kê cấu hình thành từng dòng để so sánh và hiển thị trong hộp phê duyệt. */
function describeConfig(config: GreenConfig) {
  const { policy } = config;
  return [
    ...ticketTypesStore
      .get()
      .map(
        (type) =>
          [`Điểm mỗi check-in: ${type.name}`, String(pointsPerCheckin(type.id, config))] as [
            string,
            string,
          ],
      ),
    ...config.tiers.flatMap((tier) => [
      [`${tier.name}: mốc CPoint`, tier.fromCpoint.toLocaleString("vi-VN")],
      [`${tier.name}: mức giảm`, percentText(tier.discountPercent)],
    ]),
    ["Giảm theo cấp áp dụng cho", ticketNames(policy.tierTicketTypeIds)],
    ["Chính sách sinh viên giảm", percentText(policy.studentPercent)],
    ["Chính sách sinh viên áp dụng cho", ticketNames(policy.studentTicketTypeIds)],
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
