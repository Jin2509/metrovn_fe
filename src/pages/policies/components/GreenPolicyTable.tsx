import { DataTable, Section } from "@/components/shared";
import { ticketTypesStore } from "@/mocks/admin";
import type { GreenConfig } from "@/mocks/green";
import { pointsPerCheckin } from "@/pages/green/green.service";

export function GreenPolicyTable({ config }: { config: GreenConfig }) {
  const { policy } = config;
  const points = ticketTypesStore
    .use()
    .filter((type) => pointsPerCheckin(type.id, config) > 0)
    .map((type) => `${type.name} ${pointsPerCheckin(type.id, config)}`)
    .join(", ");
  return (
    <Section
      title="Hành trình xanh"
      description={`Điểm mỗi check-in: ${points} · sinh viên giảm ${policy.studentPercent}%`}
    >
      <DataTable
        rows={config.tiers}
        cols={[
          { h: "Cấp", c: (tier) => tier.name },
          { h: "Mốc CPoint", c: (tier) => tier.fromCpoint.toLocaleString("vi-VN") },
          { h: "Giảm", c: (tier) => `${tier.discountPercent}%` },
        ]}
      />
    </Section>
  );
}
