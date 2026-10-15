import { DataTable, Section } from "@/components/shared";
import { Input } from "@/components/ui/input";
import type {
  MembershipTier,
  MembershipTierChange,
} from "@/pages/membershiptier/membershiptier.types";

export function MembershipTierTable({
  tiers,
  onTierChange,
}: {
  tiers: MembershipTier[];
  onTierChange: (change: MembershipTierChange) => void;
}) {
  return (
    <Section title="Cấu hình hạng">
      <DataTable
        rows={tiers}
        cols={[
          { h: "Hạng", c: (tier) => <b>{tier.name}</b> },
          {
            h: "Ngưỡng điểm",
            c: (tier) => (
              <Input
                type="number"
                className="h-8 w-28"
                value={tier.threshold}
                onChange={(event) =>
                  onTierChange({
                    id: tier.id,
                    field: "threshold",
                    value: Number(event.target.value),
                  })
                }
              />
            ),
          },
          {
            h: "Hệ số nhân",
            c: (tier) => (
              <Input
                type="number"
                step="0.1"
                className="h-8 w-24"
                value={tier.multiplier}
                onChange={(event) =>
                  onTierChange({
                    id: tier.id,
                    field: "multiplier",
                    value: Number(event.target.value),
                  })
                }
              />
            ),
          },
          {
            h: "Quyền lợi",
            c: (tier) => (
              <Input
                className="h-8 min-w-64"
                value={tier.benefits}
                onChange={(event) =>
                  onTierChange({ id: tier.id, field: "benefits", value: event.target.value })
                }
              />
            ),
          },
        ]}
      />
    </Section>
  );
}
