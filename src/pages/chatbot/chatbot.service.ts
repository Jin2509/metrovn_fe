import { chatbotFaqsApi, type ChatFaqResponse } from "@/lib/api";
import { useSyncedQuery } from "@/lib/query-sync";
import {
  faqStore,
  handledQuestionsStore,
  type ChatbotFaq,
  type FaqCategory,
} from "@/stores/chatbot";
import { FAQ_CATEGORY_LABELS } from "@/pages/chatbot/chatbot.constants";

export type FaqDraft = Pick<ChatbotFaq, "category" | "question" | "answer" | "keywords">;
export type FaqErrors = Partial<Record<"question" | "answer" | "category", string>>;

export const FAQS_KEY = ["chatbot", "faqs"] as const;
/** Kho tri thức nhỏ: tải một lần đủ để tìm kiếm, lọc ngay trên trình duyệt. */
const FETCH_SIZE = 500;

const isCategory = (value: string): value is FaqCategory => value in FAQ_CATEGORY_LABELS;

export const toFaq = (f: ChatFaqResponse): ChatbotFaq => ({
  id: String(f.id),
  // Danh mục backend là chuỗi tự do; giá trị lạ xếp vào "Khác".
  category: isCategory(f.category) ? f.category : "OTHER",
  question: f.question,
  answer: f.answer,
  keywords: f.keywords ?? "",
  status: "ACTIVE",
  createdBy: "",
  createdAt: f.updatedAt,
  updatedAt: f.updatedAt,
});

/** Kho FAQ, đồng bộ vào `faqStore`. Cần CHATBOT_MANAGE. */
export function useFaqsData(enabled = true) {
  return useSyncedQuery({
    queryKey: FAQS_KEY,
    queryFn: () => chatbotFaqsApi.list({ size: FETCH_SIZE }),
    store: faqStore,
    map: (page) => page.content.map(toFaq),
    enabled,
  });
}

export const emptyFaq = (question = "", category: FaqCategory = "OTHER"): FaqDraft => ({
  category,
  question,
  answer: "",
  keywords: "",
});

export const toFaqDraft = (f: ChatbotFaq): FaqDraft => ({
  category: f.category,
  question: f.question,
  answer: f.answer,
  keywords: f.keywords,
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
  const body = {
    category: d.category,
    question: d.question.trim(),
    answer: d.answer.trim(),
    keywords: normalizeKeywords(d.keywords) || undefined,
  };
  return editingId ? chatbotFaqsApi.update(Number(editingId), body) : chatbotFaqsApi.create(body);
}

export const deleteFaq = (f: ChatbotFaq) => chatbotFaqsApi.remove(Number(f.id));

export function markQuestion(question: string, state: "ADDED" | "IGNORED") {
  handledQuestionsStore.set((m) => ({ ...m, [question]: state }));
}

export const percent = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
