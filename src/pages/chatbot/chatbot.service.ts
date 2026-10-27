import { getActorName } from "@/lib/auth/session.store";
import { logAction } from "@/mocks/admin";
import {
  faqStore,
  handledQuestionsStore,
  type ChatbotFaq,
  type FaqCategory,
} from "@/mocks/chatbot";

export type FaqDraft = Pick<ChatbotFaq, "category" | "question" | "answer" | "keywords"> & {
  active: boolean;
};
export type FaqErrors = Partial<Record<"question" | "answer", string>>;

const now = () => new Date().toLocaleString("sv-SE").slice(0, 16);

export const emptyFaq = (question = "", category: FaqCategory = "OTHER"): FaqDraft => ({
  category,
  question,
  answer: "",
  keywords: "",
  active: true,
});

export const toFaqDraft = (f: ChatbotFaq): FaqDraft => ({
  category: f.category,
  question: f.question,
  answer: f.answer,
  keywords: f.keywords,
  active: f.status === "ACTIVE",
});

export function validateFaq(d: FaqDraft, all: ChatbotFaq[], editingId?: string): FaqErrors {
  const e: FaqErrors = {};
  const q = d.question.trim();
  if (!q) e.question = "Thông tin đang bị thiếu";
  else if (
    all.some((f) => f.id !== editingId && f.question.trim().toLowerCase() === q.toLowerCase())
  )
    e.question = "Câu hỏi đã có trong kho tri thức";
  if (!d.answer.trim()) e.answer = "Thông tin đang bị thiếu";
  return e;
}

/** Chuẩn hóa từ khóa: tách theo dấu phẩy, bỏ trùng, chữ thường. */
export const normalizeKeywords = (raw: string) =>
  [
    ...new Set(
      raw
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].join(", ");

export function saveFaq(d: FaqDraft, editingId?: string) {
  const fields = {
    category: d.category,
    question: d.question.trim(),
    answer: d.answer.trim(),
    keywords: normalizeKeywords(d.keywords),
    status: d.active ? ("ACTIVE" as const) : ("INACTIVE" as const),
    updatedAt: now(),
  };
  if (editingId)
    faqStore.set((list) => list.map((f) => (f.id === editingId ? { ...f, ...fields } : f)));
  else
    faqStore.set((list) => [
      {
        id: `FAQ-${String(Date.now()).slice(-4)}`,
        createdBy: getActorName(),
        createdAt: now(),
        ...fields,
      },
      ...list,
    ]);
  logAction(editingId ? "Sửa FAQ chatbot" : "Thêm FAQ chatbot", fields.question);
}

export function setFaqActive(f: ChatbotFaq, active: boolean) {
  faqStore.set((list) =>
    list.map((x) =>
      x.id === f.id ? { ...x, status: active ? "ACTIVE" : "INACTIVE", updatedAt: now() } : x,
    ),
  );
  logAction(active ? "Bật FAQ chatbot" : "Tắt FAQ chatbot", f.question);
}

export function markQuestion(question: string, state: "ADDED" | "IGNORED") {
  handledQuestionsStore.set((m) => ({ ...m, [question]: state }));
}

export const percent = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
