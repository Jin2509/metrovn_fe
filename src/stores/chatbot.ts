import { createStore } from "@/lib/store";
import { format } from "date-fns";

// Chatbot hỗ trợ hành khách phía client — bám theo 3 bảng trong báo cáo (mục 3.3.2.33–35):
//   chatbot_session  (phiên trò chuyện: kênh APP/WEB, trạng thái ACTIVE/CLOSED/EXPIRED)
//   chatbot_message  (tin nhắn: intent, confidence, action_called, response_time_ms, feedback LIKE/DISLIKE)
//   chatbot_faq      (kho tri thức: danh mục, câu hỏi, câu trả lời, từ khóa, trạng thái)
// Chatbot chỉ TRA CỨU (UC14-01/02/03), không đặt vé, không chuyển nhân viên.
// Dữ liệu thật: `chatbotFaqsApi` (kho FAQ). Backend chưa có API phiên/tin nhắn cho quản trị.

export type ChatChannel = "APP" | "WEB";
export type SessionStatus = "ACTIVE" | "CLOSED" | "EXPIRED";
export type FaqCategory =
  "LINE" | "STATION" | "FARE" | "FACILITY" | "TICKET" | "PARKING" | "LOYALTY" | "GUIDE" | "OTHER";

/** Ý định chatbot nhận diện được, nhóm theo use case của báo cáo. */
export type ChatIntent =
  | "LINE_INFO"
  | "STATION_INFO"
  | "FARE_QUERY"
  | "NEARBY_FACILITY"
  | "BUS_CONNECTION"
  | "MY_TICKETS"
  | "MY_LOYALTY"
  | "FAQ"
  | "OUT_OF_SCOPE";

export type ChatbotSession = {
  id: string;
  sessionToken: string;
  userId: string;
  userName: string;
  channel: ChatChannel;
  startedAt: string;
  lastMessageAt: string;
  endedAt?: string;
  status: SessionStatus;
};

export type ChatbotMessage = {
  id: string;
  sessionId: string;
  sender: "USER" | "BOT";
  content: string;
  /** null = không nhận diện được ý định (độ tin cậy dưới ngưỡng). Chỉ có ở tin của BOT. */
  intent: ChatIntent | null;
  confidence: number | null;
  actionCalled: string | null;
  /** Lấy từ response_data khi action là tra cứu FAQ. */
  faqId?: string;
  responseTimeMs: number | null;
  feedback: "LIKE" | "DISLIKE" | null;
  createdAt: string;
};

export type ChatbotFaq = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  keywords: string;
  status: "ACTIVE" | "INACTIVE";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export const faqStore = createStore<ChatbotFaq[]>([]);

/** Mốc "hôm nay" cho thống kê, theo giờ máy. */
export const CHATBOT_TODAY = format(new Date(), "yyyy-MM-dd");

export const sessionsStore = createStore<ChatbotSession[]>([]);
export const messagesStore = createStore<ChatbotMessage[]>([]);

/** Câu hỏi chưa nhận diện được mà Admin đã xử lý (thêm vào FAQ hoặc bỏ qua), theo nội dung câu hỏi. */
export const handledQuestionsStore = createStore<Record<string, "ADDED" | "IGNORED">>({});
