import { useState } from "react";
import { toast } from "sonner";
import { faqStore, type ChatbotFaq, type FaqCategory } from "@/mocks/chatbot";
import {
  emptyFaq,
  saveFaq,
  toFaqDraft,
  validateFaq,
  type FaqDraft,
  type FaqErrors,
} from "@/pages/chatbot/chatbot.service";

/** Hộp thoại thêm/sửa FAQ — dùng ở tab Kho tri thức và khi thêm từ câu hỏi chưa nhận diện được. */
export function useFaqEditor(onSaved?: () => void) {
  const all = faqStore.use();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [draft, setDraft] = useState<FaqDraft>(emptyFaq());
  const [errors, setErrors] = useState<FaqErrors>({});

  return {
    open,
    setOpen,
    editing: !!editingId,
    draft,
    setDraft,
    errors,
    openCreate: (question = "", category: FaqCategory = "OTHER") => {
      setEditingId(undefined);
      setDraft(emptyFaq(question, category));
      setErrors({});
      setOpen(true);
    },
    openEdit: (f: ChatbotFaq) => {
      setEditingId(f.id);
      setDraft(toFaqDraft(f));
      setErrors({});
      setOpen(true);
    },
    submit: () => {
      const next = validateFaq(draft, all, editingId);
      setErrors(next);
      if (Object.keys(next).length) return;
      saveFaq(draft, editingId);
      toast.success(
        draft.active ? "Đã lưu, chatbot dùng câu trả lời này ngay" : "Đã lưu ở trạng thái tắt",
      );
      setOpen(false);
      onSaved?.();
    },
  };
}

export type FaqEditor = ReturnType<typeof useFaqEditor>;
