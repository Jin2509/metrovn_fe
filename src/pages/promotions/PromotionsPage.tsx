import { BadgePercent, Crown } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { MembershipTierPanel } from "@/pages/membershiptier";
import { PromotionFormDialog } from "@/pages/promotions/components/PromotionFormDialog";
import { PromotionTable } from "@/pages/promotions/components/PromotionTable";
import { usePromotions } from "@/pages/promotions/hooks/usePromotions";

function PromotionListPanel() {
  const { promos, open, setOpen, draft, setDraft, error, save, toggleStatus } = usePromotions();

  return (
    <>
      <PromotionTable
        promos={promos}
        onToggleStatus={toggleStatus}
        onCreate={() => setOpen(true)}
      />
      <PromotionFormDialog
        open={open}
        draft={draft}
        error={error}
        onOpenChange={setOpen}
        onDraftChange={setDraft}
        onSave={save}
      />
    </>
  );
}

export function PromotionsPage() {
  return (
    <AppShell title="Ưu đãi & thành viên">
      <PageTabs
        tabs={[
          {
            value: "promotions",
            label: "Khuyến mãi",
            icon: BadgePercent,
            content: <PromotionListPanel />,
          },
          {
            value: "tiers",
            label: "Hạng thành viên",
            icon: Crown,
            content: <MembershipTierPanel />,
          },
        ]}
      />
    </AppShell>
  );
}
