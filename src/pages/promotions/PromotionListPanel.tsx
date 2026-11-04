import { PromotionFormDialog } from "@/pages/promotions/components/PromotionFormDialog";
import { PromotionTable } from "@/pages/promotions/components/PromotionTable";
import { usePromotions } from "@/pages/promotions/hooks/usePromotions";

/** Tab "Chương trình ưu đãi" trong trang Hành trình xanh: app vẫn hiện các ưu đãi đang chạy dưới thang CPoint. */
export function PromotionListPanel() {
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
