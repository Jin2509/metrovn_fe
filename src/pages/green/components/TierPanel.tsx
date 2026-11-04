import { Leaf, Sprout, TreePine, Trees, type LucideIcon } from "lucide-react";
import { DataTable, Section } from "@/components/shared";
import { Input } from "@/components/ui/input";
import type { GreenTier, GreenTierId } from "@/mocks/green";
import { loyaltyMembers } from "@/mocks/loyalty";
import { RuleList } from "@/pages/green/components/fields";
import { maskEmail, TOP_MEMBERS, topMembers } from "@/pages/green/green.service";
import type { GreenConfigForm } from "@/pages/green/hooks/useGreenConfig";

export const TIER_ICONS: Record<GreenTierId, LucideIcon> = {
  SEED: Sprout,
  SPROUT: Leaf,
  TREE: TreePine,
  FOREST: Trees,
};

function TierName({ tier }: { tier: GreenTier }) {
  const Icon = TIER_ICONS[tier.id];
  return (
    <span className="flex items-center gap-2 font-medium">
      <Icon className="h-4 w-4 text-success" />
      {tier.name}
    </span>
  );
}

/** Tab "Nâng hạng": bốn cấp theo CPoint tích lũy và các thành viên nhiều điểm nhất. */
export function TierPanel({ form }: { form: GreenConfigForm }) {
  const { config, saved, locked, update } = form;
  const editTier = (id: GreenTierId, patch: Partial<GreenTier>) =>
    update({ tiers: config.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.2fr]">
      <div className="min-w-0 space-y-6">
        <Section
          title="Các cấp thành viên"
          description="App mobile đang cố định 4 cấp nên chỉ chỉnh mốc và mức giảm."
        >
          <DataTable
            rows={config.tiers}
            cols={[
              { h: "Cấp", c: (tier) => <TierName tier={tier} /> },
              {
                h: "Mốc CPoint",
                c: (tier) => (
                  <Input
                    type="number"
                    min={0}
                    aria-label={`Mốc CPoint của cấp ${tier.name}`}
                    className="h-8 w-24"
                    value={tier.fromCpoint}
                    disabled={locked || tier.id === "SEED"}
                    onChange={(event) =>
                      editTier(tier.id, { fromCpoint: Number(event.target.value) })
                    }
                  />
                ),
              },
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
        <Section title="Quy tắc nâng hạng">
          <RuleList
            rules={[
              "Xét theo tổng CPoint tích lũy từ trước đến nay, không reset theo kỳ.",
              "CPoint không bị trừ khi dùng, nên không tụt cấp vì mua vé.",
              "Đạt mốc là lên cấp ngay; app chúc mừng một lần cho mỗi lần lên cấp.",
            ]}
          />
        </Section>
      </div>
      <Section
        title={`Top ${TOP_MEMBERS} thành viên theo CPoint`}
        description={`Trong tổng số ${loyaltyMembers.length} thành viên, xếp cấp theo thang đang áp dụng.`}
      >
        <DataTable
          rows={topMembers(loyaltyMembers, saved.tiers)}
          cols={[
            { h: "Hạng", c: (member) => `#${member.rank}`, className: "w-14" },
            {
              h: "Thành viên",
              c: (member) => (
                <>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{maskEmail(member.email)}</p>
                </>
              ),
            },
            {
              h: "CPoint",
              c: (member) => <b>{member.cpoint.toLocaleString("vi-VN")}</b>,
              className: "text-right",
            },
            { h: "Lượt check-in", c: (member) => member.checkins, className: "text-right" },
            { h: "Cấp", c: (member) => <TierName tier={member.tier} /> },
          ]}
        />
      </Section>
    </div>
  );
}
