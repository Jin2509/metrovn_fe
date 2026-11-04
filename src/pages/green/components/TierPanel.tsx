import { Leaf, Sprout, TreePine, Trees, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { DataTable, Section } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { GreenTier, GreenTierId } from "@/mocks/green";
import { decimal, NumberField, RuleList } from "@/pages/green/components/fields";
import { cpointOf, tierOf } from "@/pages/green/green.service";
import type { GreenConfigForm } from "@/pages/green/hooks/useGreenConfig";

export const TIER_ICONS: Record<GreenTierId, LucideIcon> = {
  SEED: Sprout,
  SPROUT: Leaf,
  TREE: TreePine,
  FOREST: Trees,
};

/** Tab "Nâng hạng": bốn cấp theo CO₂ tích lũy và mức giảm của từng cấp. */
export function TierPanel({ form }: { form: GreenConfigForm }) {
  const { config, locked, update } = form;
  const [points, setPoints] = useState(635);
  const kg = points / (config.cpointPerKg || 1);
  const result = tierOf(kg, config.tiers);
  const editTier = (id: GreenTierId, patch: Partial<GreenTier>) =>
    update({ tiers: config.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Section
        title="Thang cấp"
        description="App mobile đang cố định 4 cấp nên chỉ chỉnh mốc và mức giảm, không thêm hoặc bớt cấp."
      >
        <DataTable
          rows={config.tiers}
          cols={[
            {
              h: "Cấp",
              c: (tier) => {
                const Icon = TIER_ICONS[tier.id];
                return (
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4 text-success" />
                    {tier.name}
                  </span>
                );
              },
            },
            {
              h: "Mốc CO₂ (kg)",
              c: (tier) => (
                <Input
                  type="number"
                  min={0}
                  step="any"
                  aria-label={`Mốc CO₂ của cấp ${tier.name}`}
                  className="h-8 w-24"
                  value={tier.fromKg}
                  disabled={locked || tier.id === "SEED"}
                  onChange={(event) => editTier(tier.id, { fromKg: Number(event.target.value) })}
                />
              ),
            },
            { h: "Mốc CPoint", c: (tier) => cpointOf(tier.fromKg, config).toLocaleString("vi-VN") },
            {
              h: "Giảm (%)",
              c: (tier) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  aria-label={`Mức giảm của cấp ${tier.name}`}
                  className="h-8 w-20"
                  value={tier.discountPercent}
                  disabled={locked}
                  onChange={(event) =>
                    editTier(tier.id, { discountPercent: Number(event.target.value) })
                  }
                />
              ),
            },
          ]}
        />
      </Section>

      <div className="min-w-0 space-y-6">
        <Section title="Tra cứu cấp theo CPoint">
          <div className="space-y-3">
            <NumberField
              id="preview-points"
              label="Số CPoint của thành viên"
              value={points}
              onChange={setPoints}
            />
            <p className="text-sm">
              Cấp <b>{result.tier.name}</b>, giảm <b>{result.tier.discountPercent}%</b>
            </p>
            <Progress value={result.progress * 100} aria-label="Tiến độ lên cấp kế tiếp" />
            <p className="text-xs text-muted-foreground">
              {result.next
                ? `Còn ${decimal(result.kgToNext, 2)} kg CO₂ nữa lên cấp ${result.next.name}`
                : "Đã ở cấp cao nhất"}
            </p>
          </div>
        </Section>
        <Section title="Quy tắc nâng hạng">
          <RuleList
            rules={[
              "Xét theo tổng CO₂ đã bớt từ trước đến nay, không reset theo kỳ.",
              "CPoint là thang ưu đãi, không bị trừ khi dùng, nên không tụt cấp vì mua vé.",
              "Đạt mốc là lên cấp ngay; app chúc mừng một lần cho mỗi lần lên cấp.",
            ]}
          />
        </Section>
      </div>
    </div>
  );
}
