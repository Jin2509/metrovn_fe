import { describe, expect, it } from "vitest";

import { faqStore, messagesStore, sessionsStore, type ChatbotMessage } from "@/mocks/chatbot";
import { saveFaq, validateFaq, normalizeKeywords } from "@/pages/chatbot/chatbot.service";
import {
  computeStats,
  dislikedReplies,
  faqUsage,
  filterLog,
  percentile,
  unrecognizedQuestions,
} from "@/pages/chatbot/chatbot.stats";

const msg = (p: Partial<ChatbotMessage>): ChatbotMessage => ({
  id: "x",
  sessionId: "S",
  sender: "BOT",
  content: "",
  intent: "FARE_QUERY",
  confidence: 0.9,
  actionCalled: "getFare",
  responseTimeMs: 1000,
  feedback: null,
  createdAt: "2026-10-27 08:00",
  ...p,
});

describe("computeStats — đếm trực tiếp từ chatbot_message", () => {
  it("tỉ lệ nhận diện, thời gian phản hồi, đánh giá", () => {
    const messages = [
      msg({ sender: "USER", intent: null, responseTimeMs: null, content: "Hỏi 1" }),
      msg({ feedback: "LIKE" }),
      msg({ sender: "USER", intent: null, responseTimeMs: null, content: "Thú cưng?" }),
      msg({ intent: null, responseTimeMs: 4000, feedback: "DISLIKE" }),
    ];
    const s = computeStats([], messages);
    expect(s).toMatchObject({
      questions: 2,
      replies: 2,
      recognized: 1,
      unrecognized: 1,
      likes: 1,
      dislikes: 1,
    });
    expect(s.recognitionRate).toBe(0.5);
    expect(s.avgResponseMs).toBe(2500);
    expect(s.withinLimitRate).toBe(0.5);
    expect(s.satisfaction).toBe(0.5);
    expect(unrecognizedQuestions(messages)).toEqual([
      { question: "Thú cưng?", count: 1, last: "2026-10-27 08:00" },
    ]);
    expect(dislikedReplies(messages)[0].question).toBe("Thú cưng?");
  });

  it("không chia cho 0 khi chưa có dữ liệu; percentile nearest-rank", () => {
    expect(computeStats([], [])).toMatchObject({
      recognitionRate: 0,
      avgResponseMs: 0,
      satisfaction: 0,
    });
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95)).toBe(10);
  });
});

describe("dữ liệu mẫu", () => {
  const sessions = sessionsStore.get();
  const messages = messagesStore.get();

  it("lọc 7 ngày ít hơn 30 ngày; lọc kênh chỉ còn kênh đó", () => {
    const week = filterLog(sessions, messages, { days: 7, channel: "ALL" });
    const month = filterLog(sessions, messages, { days: 30, channel: "ALL" });
    expect(week.sessions.length).toBeLessThan(month.sessions.length);
    expect(week.sessions.every((s) => s.startedAt >= "2026-10-21")).toBe(true);
    expect(
      filterLog(sessions, messages, { days: 30, channel: "WEB" }).sessions.every(
        (s) => s.channel === "WEB",
      ),
    ).toBe(true);
  });

  it("mỗi câu hỏi có đúng một câu trả lời; FAQ được dùng có trong kho", () => {
    expect(messages.filter((m) => m.sender === "USER").length).toBe(
      messages.filter((m) => m.sender === "BOT").length,
    );
    const ids = new Set(faqStore.get().map((f) => f.id));
    expect(Object.keys(faqUsage(messages)).every((id) => ids.has(id))).toBe(true);
  });
});

describe("kho tri thức", () => {
  it("bắt trùng câu hỏi và thiếu thông tin; chuẩn hóa từ khóa", () => {
    const all = faqStore.get();
    expect(
      validateFaq(
        {
          category: "OTHER",
          question: all[0].question.toUpperCase(),
          answer: "x",
          keywords: "",
          active: true,
        },
        all,
      ).question,
    ).toBe("Câu hỏi đã có trong kho tri thức");
    expect(
      validateFaq({ category: "OTHER", question: "", answer: "", keywords: "", active: true }, all),
    ).toEqual({
      question: "Thông tin đang bị thiếu",
      answer: "Thông tin đang bị thiếu",
    });
    expect(normalizeKeywords(" Vé, vé ,QR,, qr")).toBe("vé, qr");
  });

  it("thêm FAQ ở trạng thái tắt", () => {
    const before = faqStore.get();
    saveFaq({
      category: "GUIDE",
      question: "Có wifi trên tàu không?",
      answer: "Chưa có.",
      keywords: "wifi",
      active: false,
    });
    expect(faqStore.get()[0]).toMatchObject({ status: "INACTIVE", category: "GUIDE" });
    faqStore.set(() => before);
  });
});
