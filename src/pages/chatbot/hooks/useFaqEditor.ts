import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api";
import { faqStore, type ChatbotFaq, type FaqCategory } from "@/stores/chatbot";
import {
  FAQS_KEY,
  emptyFaq,
  saveFaq,
  toFaqDraft,
  validateFaq,
  type FaqDraft,
  type FaqErrors,
} from "@/pages/chatbot/chatbot.service";

/** Hộp thoại thêm/sửa FAQ — dùng ở tab Kho tri thức và khi thêm từ câu hỏi chưa nhận diện được. */
export function useFaqEditor(onSaved?: () => void) {
  const queryClient = useQueryClient();
  const all = faqStore.use();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
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
    pending,
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
    /** Trả về false khi còn lỗi nhập liệu (để form chuyển focus tới ô sai). */
    submit: async () => {
      const next = validateFaq(draft, all, editingId);
      setErrors(next);
      if (Object.keys(next).length) return false;
      if (pending) return true;
      setPending(true);
      try {
        await saveFaq(draft, editingId);
        toast.success("Đã lưu, chatbot dùng câu trả lời này ngay");
        await queryClient.invalidateQueries({ queryKey: FAQS_KEY });
        setOpen(false);
        onSaved?.();
      } catch (error) {
        toast.error(apiErrorMessage(error));
      } finally {
        setPending(false);
      }
      return true;
    },
  };
}

export type FaqEditor = ReturnType<typeof useFaqEditor>;
