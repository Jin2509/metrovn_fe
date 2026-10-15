import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { MembershipTierTable } from "@/pages/membershiptier/components/MembershipTierTable";
import { useMembershipTiers } from "@/pages/membershiptier/hooks/useMembershipTiers";

export function MembershipTierPage() {
  const { tiers, updateTier, save } = useMembershipTiers();

  return (
    <AppShell
      title="Hạng thành viên"
      roles={["ADMIN"]}
      actions={<Button onClick={save}>Lưu thay đổi</Button>}
    >
      <MembershipTierTable tiers={tiers} onTierChange={updateTier} />
    </AppShell>
  );
}
