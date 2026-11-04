import { DataTable, Section } from "@/components/shared";
import type { GreenConfig } from "@/mocks/green";
import { cpointOf } from "@/pages/green/green.service";

export function GreenPolicyTable({ config }: { config: GreenConfig }) {
  const { policy } = config;
  const combine =
    policy.combineMode === "SEQUENTIAL" ? "cộng dồn lần lượt" : "chỉ lấy mức cao nhất";
  return (
    <Section
      title="Hành trình xanh"
      description={`${config.cpointPerKg} CPoint mỗi kg CO₂ · sinh viên giảm ${policy.studentPercent}% · ưu đãi ${combine}`}
    >
      <DataTable
        rows={config.tiers}
        cols={[
          { h: "Cấp", c: (tier) => tier.name },
          { h: "Mốc CO₂", c: (tier) => `${tier.fromKg} kg` },
          { h: "Mốc CPoint", c: (tier) => cpointOf(tier.fromKg, config).toLocaleString("vi-VN") },
          { h: "Giảm", c: (tier) => `${tier.discountPercent}%` },
        ]}
      />
    </Section>
  );
}
