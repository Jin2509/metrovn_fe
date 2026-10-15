import { DataTable, Section } from "@/components/shared";
import type { MembershipTier } from "@/pages/policies/policies.types";

export function MembershipTiersTable({ tiers }: { tiers: MembershipTier[] }) {
  return (
    <Section title="Hạng thành viên">
      <DataTable
        rows={tiers}
        cols={[
          { h: "Hạng", c: (tier) => tier.name },
          { h: "Ngưỡng", c: (tier) => tier.threshold },
          { h: "Hệ số", c: (tier) => `×${tier.multiplier}` },
        ]}
      />
    </Section>
  );
}
