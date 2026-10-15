import { logAction, tiersStore } from "@/mocks/admin";
import type {
  MembershipTier,
  MembershipTierChange,
} from "@/pages/membershiptier/membershiptier.types";

export function updateMembershipTier(change: MembershipTierChange) {
  tiersStore.set((tiers) =>
    tiers.map((tier) => {
      if (tier.id !== change.id) return tier;
      if (change.field === "threshold") return { ...tier, threshold: change.value };
      if (change.field === "multiplier") return { ...tier, multiplier: change.value };
      return { ...tier, benefits: change.value };
    }),
  );
}

export function saveMembershipTiers(tiers: MembershipTier[]) {
  const isValid = tiers.every(
    (tier, index) => index === 0 || tier.threshold > tiers[index - 1].threshold,
  );
  if (!isValid) return false;
  logAction("Cập nhật hạng thành viên", "Tất cả hạng");
  return true;
}
