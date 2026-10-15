import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PromotionFormDialog } from "@/pages/promotions/components/PromotionFormDialog";
import { PromotionTable } from "@/pages/promotions/components/PromotionTable";
import { usePromotions } from "@/pages/promotions/hooks/usePromotions";

export function PromotionsPage() {
  const { promos, open, setOpen, draft, setDraft, error, save, toggleStatus } = usePromotions();

  return (
    <AppShell
      title="Khuyến mãi"
      roles={["ADMIN"]}
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo khuyến mãi
        </Button>
      }
    >
      <PromotionTable promos={promos} onToggleStatus={toggleStatus} />
      <PromotionFormDialog
        open={open}
        draft={draft}
        error={error}
        onOpenChange={setOpen}
        onDraftChange={setDraft}
        onSave={save}
      />
    </AppShell>
  );
}
