import { MembershipTierTable } from "@/pages/membershiptier/components/MembershipTierTable";
import { useMembershipTiers } from "@/pages/membershiptier/hooks/useMembershipTiers";

/** Tab "Hạng thành viên" trong trang Ưu đãi & thành viên. */
export function MembershipTierPanel() {
  const { tiers, updateTier, save } = useMembershipTiers();

  return <MembershipTierTable tiers={tiers} onTierChange={updateTier} onSave={save} />;
}
