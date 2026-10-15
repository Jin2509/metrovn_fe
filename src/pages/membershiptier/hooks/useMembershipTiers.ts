import { toast } from "sonner";
import { tiersStore } from "@/mocks/admin";
import {
  saveMembershipTiers,
  updateMembershipTier,
} from "@/pages/membershiptier/membershiptier.service";
import type { MembershipTierChange } from "@/pages/membershiptier/membershiptier.types";

export function useMembershipTiers() {
  const tiers = tiersStore.use();

  const updateTier = (change: MembershipTierChange) => updateMembershipTier(change);

  const save = () => {
    if (!saveMembershipTiers(tiers)) return toast.error("Ngưỡng điểm phải tăng dần theo hạng");
    toast.success("Đã lưu cấu hình hạng thành viên");
  };

  return { tiers, updateTier, save };
}
