import {
  CHATBOT_TODAY,
  type ChatChannel,
  type ChatbotMessage,
  type ChatbotSession,
} from "@/mocks/chatbot";
import { INTENT_INFO, RESPONSE_LIMIT_MS } from "@/pages/chatbot/chatbot.constants";

// Thống kê chatbot. Mỗi số đều đếm trực tiếp từ bảng chatbot_session / chatbot_message:
//   - Phiên: số dòng chatbot_session
//   - Câu hỏi: tin nhắn sender = USER
//   - Nhận diện được: tin BOT có intent khác null
//   - Thời gian phản hồi: cột response_time_ms
//   - Đánh giá: cột feedback (LIKE / DISLIKE)

export type Period = 7 | 30;
export type ChannelFilter = "ALL" | ChatChannel;

export function filterLog(
  sessions: ChatbotSession[],
  messages: ChatbotMessage[],
  { days, channel }: { days: Period; channel: ChannelFilter },
  today = CHATBOT_TODAY,
) {
  const from = new Date(`${today}T00:00:00`);
  from.setDate(from.getDate() - (days - 1));
  // Định dạng theo giờ máy (không dùng toISOString vì UTC lệch ngày ở múi giờ Việt Nam).
  const fromKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
  const s = sessions.filter(
    (x) => x.startedAt.slice(0, 10) >= fromKey && (channel === "ALL" || x.channel === channel),
  );
  const ids = new Set(s.map((x) => x.id));
  return { sessions: s, messages: messages.filter((m) => ids.has(m.sessionId)) };
}

export function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}

const ratio = (a: number, b: number) => (b ? a / b : 0);

export function computeStats(sessions: ChatbotSession[], messages: ChatbotMessage[]) {
  const bot = messages.filter((m) => m.sender === "BOT");
  const recognized = bot.filter((m) => m.intent !== null);
  const latencies = bot.map((m) => m.responseTimeMs).filter((v): v is number => v !== null);
  const likes = bot.filter((m) => m.feedback === "LIKE").length;
  const dislikes = bot.filter((m) => m.feedback === "DISLIKE").length;
  return {
    sessions: sessions.length,
    questions: messages.filter((m) => m.sender === "USER").length,
    replies: bot.length,
    recognized: recognized.length,
    unrecognized: bot.length - recognized.length,
    outOfScope: bot.filter((m) => m.intent === "OUT_OF_SCOPE").length,
    recognitionRate: ratio(recognized.length, bot.length),
    avgResponseMs: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
    p95ResponseMs: percentile(latencies, 95),
    withinLimitRate: ratio(
      latencies.filter((v) => v <= RESPONSE_LIMIT_MS).length,
      latencies.length,
    ),
    likes,
    dislikes,
    feedbackCount: likes + dislikes,
    satisfaction: ratio(likes, likes + dislikes),
    feedbackRate: ratio(likes + dislikes, bot.length),
    byChannel: {
      APP: sessions.filter((s) => s.channel === "APP").length,
      WEB: sessions.filter((s) => s.channel === "WEB").length,
    },
  };
}

/** Số câu hỏi mỗi ngày, tách được / không nhận diện được. */
export function dailySeries(messages: ChatbotMessage[]) {
  const map = new Map<string, { recognized: number; unrecognized: number }>();
  for (const m of messages) {
    if (m.sender !== "BOT") continue;
    const day = m.createdAt.slice(0, 10);
    const cur = map.get(day) ?? { recognized: 0, unrecognized: 0 };
    if (m.intent) cur.recognized++;
    else cur.unrecognized++;
    map.set(day, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day: `${day.slice(8, 10)}/${day.slice(5, 7)}`, ...v }));
}

/** Số câu hỏi theo nhóm use case (cột intent). */
export function byUseCase(messages: ChatbotMessage[]) {
  const bot = messages.filter((m) => m.sender === "BOT" && m.intent);
  const groups = new Map<string, number>();
  for (const m of bot)
    groups.set(INTENT_INFO[m.intent!].group, (groups.get(INTENT_INFO[m.intent!].group) ?? 0) + 1);
  return [...groups.entries()]
    .map(([group, count]) => ({ group, count, share: ratio(count, bot.length) }))
    .sort((a, b) => b.count - a.count);
}

/** Câu hỏi của hành khách mà bot trả lời bằng câu dự phòng (intent = null), gom theo nội dung. */
export function unrecognizedQuestions(messages: ChatbotMessage[]) {
  const map = new Map<string, { count: number; last: string }>();
  messages.forEach((m, i) => {
    if (m.sender !== "BOT" || m.intent !== null) return;
    const q = messages[i - 1];
    if (!q || q.sender !== "USER") return;
    const cur = map.get(q.content) ?? { count: 0, last: "" };
    map.set(q.content, {
      count: cur.count + 1,
      last: q.createdAt > cur.last ? q.createdAt : cur.last,
    });
  });
  return [...map.entries()]
    .map(([question, v]) => ({ question, ...v }))
    .sort((a, b) => b.count - a.count);
}

/** Câu trả lời bị đánh giá DISLIKE, kèm câu hỏi đứng trước để Admin xem lại. */
export function dislikedReplies(messages: ChatbotMessage[]) {
  return messages
    .map((m, i) => ({ m, q: messages[i - 1] }))
    .filter(({ m }) => m.sender === "BOT" && m.feedback === "DISLIKE")
    .map(({ m, q }) => ({
      id: m.id,
      sessionId: m.sessionId,
      question: q?.content ?? "",
      answer: m.content,
      at: m.createdAt,
      intent: m.intent,
    }))
    .reverse();
}

/** Số lần mỗi FAQ được dùng để trả lời (action_called = searchFaq, response_data.faqId). */
export function faqUsage(messages: ChatbotMessage[]) {
  const map: Record<string, number> = {};
  for (const m of messages) if (m.faqId) map[m.faqId] = (map[m.faqId] ?? 0) + 1;
  return map;
}
