import { promosStore, submitApproval } from "@/mocks/admin";
import { formatPromotionDate } from "@/pages/promotions/promotions.utils";
import type { PromotionDraft } from "@/pages/promotions/promotions.types";

export function createPromotion(draft: PromotionDraft): string | null {
  if (!draft.name.trim()) return "Vui lòng nhập tên chương trình";
  const discount = Number(draft.discount);
  if (!(discount > 0 && discount <= 100)) return "Mức giảm phải từ 1 đến 100%";
  if (!draft.start || !draft.end || draft.end < draft.start)
    return "Thời gian không hợp lệ: ngày kết thúc phải sau ngày bắt đầu";

  const id = `KM${Date.now()}`;
  promosStore.set((promos) => [
    {
      id,
      name: draft.name,
      discount,
      start: draft.start,
      end: draft.end,
      status: "DRAFT",
    },
    ...promos,
  ]);
  submitApproval("PROMOTION", `Khuyến mãi: ${draft.name}`, [
    { field: "Giảm", old: "—", new: `${discount}%` },
    {
      field: "Thời gian",
      old: "—",
      new: `${formatPromotionDate(draft.start)} – ${formatPromotionDate(draft.end)}`,
    },
  ]);
  return null;
}

export function togglePromotionStatus(promoId: string) {
  promosStore.set((promos) =>
    promos.map((promo) =>
      promo.id === promoId
        ? { ...promo, status: promo.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
        : promo,
    ),
  );
}
