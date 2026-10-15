import { useState } from "react";
import { toast } from "sonner";
import { promosStore } from "@/mocks/admin";
import { EMPTY_PROMOTION_DRAFT } from "@/pages/promotions/promotions.constants";
import { createPromotion, togglePromotionStatus } from "@/pages/promotions/promotions.service";
import type { PromotionDraft } from "@/pages/promotions/promotions.types";

export function usePromotions() {
  const promos = promosStore.use();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PromotionDraft>(EMPTY_PROMOTION_DRAFT);
  const [error, setError] = useState("");

  const save = () => {
    const validationError = createPromotion(draft);
    if (validationError) return setError(validationError);
    toast.success("Đã lưu nháp và gửi duyệt");
    setOpen(false);
    setError("");
    setDraft(EMPTY_PROMOTION_DRAFT);
  };

  return {
    promos,
    open,
    setOpen,
    draft,
    setDraft,
    error,
    save,
    toggleStatus: togglePromotionStatus,
  };
}
