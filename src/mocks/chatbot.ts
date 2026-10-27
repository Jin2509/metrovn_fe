import { createStore } from "@/lib/store";
import { stations } from "./metro";

// Dữ liệu GIẢ LẬP của chatbot hỗ trợ hành khách — bám theo 3 bảng trong báo cáo (mục 3.3.2.33–35):
//   chatbot_session  (phiên trò chuyện: kênh APP/WEB, trạng thái ACTIVE/CLOSED/EXPIRED)
//   chatbot_message  (tin nhắn: intent, confidence, action_called, response_time_ms, feedback LIKE/DISLIKE)
//   chatbot_faq      (kho tri thức: danh mục, câu hỏi, câu trả lời, từ khóa, trạng thái)
// Chatbot chỉ TRA CỨU (UC14-01/02/03), không đặt vé, không chuyển nhân viên.

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

export const faqStore = createStore<ChatbotFaq[]>([
  {
    id: "FAQ-01",
    category: "FARE",
    question: "Giá vé lượt được tính như thế nào?",
    answer:
      "Giá vé lượt tính theo cự ly giữa ga đi và ga đến, theo bảng giá vé lượt đang áp dụng của từng tuyến.",
    keywords: "giá vé, vé lượt, bao nhiêu tiền",
    status: "ACTIVE",
    createdBy: "Nguyễn Văn An",
    createdAt: "2026-09-02 09:00",
    updatedAt: "2026-10-01 09:00",
  },
  {
    id: "FAQ-02",
    category: "TICKET",
    question: "Vé ngày và vé tháng khác nhau thế nào?",
    answer:
      "Vé ngày đi không giới hạn trong 24 giờ kể từ lần quét đầu tiên; vé tháng có hiệu lực 30 ngày kể từ ngày kích hoạt.",
    keywords: "vé ngày, vé tháng, hiệu lực",
    status: "ACTIVE",
    createdBy: "Nguyễn Văn An",
    createdAt: "2026-09-02 09:05",
    updatedAt: "2026-09-20 15:30",
  },
  {
    id: "FAQ-03",
    category: "GUIDE",
    question: "Làm sao để vào ga bằng vé trên ứng dụng?",
    answer:
      "Mở mục Vé của tôi, chọn vé còn hiệu lực và đưa mã QR cho nhân viên hoặc cổng soát vé quét khi vào ga.",
    keywords: "qr, vào ga, check-in, quét vé",
    status: "ACTIVE",
    createdBy: "Nguyễn Văn An",
    createdAt: "2026-09-03 10:00",
    updatedAt: "2026-09-03 10:00",
  },
  {
    id: "FAQ-04",
    category: "LINE",
    question: "Tàu chạy từ mấy giờ đến mấy giờ?",
    answer:
      "Giờ chạy tàu theo cấu hình vận hành đang áp dụng của từng tuyến; Tuyến 1 hiện chạy từ 05:00 đến 22:00.",
    keywords: "giờ chạy, chuyến đầu, chuyến cuối",
    status: "ACTIVE",
    createdBy: "Nguyễn Văn An",
    createdAt: "2026-09-03 10:10",
    updatedAt: "2026-10-02 10:00",
  },
  {
    id: "FAQ-05",
    category: "PARKING",
    question: "Đăng ký gửi xe tại ga như thế nào?",
    answer:
      "Vào mục Gửi xe, chọn ga, loại xe và gói gửi (lượt hoặc tháng), sau đó thanh toán trực tuyến.",
    keywords: "gửi xe, bãi xe, xe máy",
    status: "ACTIVE",
    createdBy: "Nguyễn Văn An",
    createdAt: "2026-09-05 08:45",
    updatedAt: "2026-09-28 08:45",
  },
  {
    id: "FAQ-06",
    category: "LOYALTY",
    question: "Điểm tích lũy được cộng như thế nào?",
    answer:
      "Mỗi giao dịch mua vé hoặc gửi xe thành công được cộng điểm theo hệ số của hạng thành viên hiện tại.",
    keywords: "điểm, tích điểm, hạng thành viên",
    status: "ACTIVE",
    createdBy: "Nguyễn Văn An",
    createdAt: "2026-09-06 14:20",
    updatedAt: "2026-09-15 14:20",
  },
  {
    id: "FAQ-07",
    category: "FACILITY",
    question: "Ga có thang máy cho người khuyết tật không?",
    answer:
      "Các ga Tuyến 1 đều có thang máy từ mặt đất lên sảnh và sân ga; liên hệ nhân viên ga nếu cần hỗ trợ.",
    keywords: "thang máy, xe lăn, khuyết tật",
    status: "INACTIVE",
    createdBy: "Nguyễn Văn An",
    createdAt: "2026-10-20 16:40",
    updatedAt: "2026-10-20 16:40",
  },
]);

// ---------- Sinh log hội thoại mẫu ----------

type Template = {
  intent: ChatIntent;
  action: string | null;
  weight: number;
  ask: (s: string, t: string) => string;
  answer: (s: string, t: string) => string;
  faqId?: string;
};

const TEMPLATES: Template[] = [
  {
    intent: "FARE_QUERY",
    action: "getFare",
    weight: 26,
    ask: (s, t) => `Giá vé từ ga ${s} đến ga ${t} là bao nhiêu?`,
    answer: (s, t) =>
      `Vé lượt từ ga ${s} đến ga ${t} theo bảng giá hiện hành. Bạn có thể đặt vé trong mục Đặt vé.`,
  },
  {
    intent: "STATION_INFO",
    action: "getStationInfo",
    weight: 14,
    ask: (s) => `Ga ${s} nằm ở đâu?`,
    answer: (s) => `Ga ${s} thuộc Tuyến 1, đang hoạt động. Bạn có thể xem vị trí ga trên bản đồ.`,
  },
  {
    intent: "LINE_INFO",
    action: "getLineInfo",
    weight: 12,
    ask: () => "Tuyến 1 đi qua những ga nào?",
    answer: () => "Tuyến 1 có 14 ga từ Bến Thành đến Suối Tiên.",
  },
  {
    intent: "BUS_CONNECTION",
    action: "getBusRoutes",
    weight: 9,
    ask: (s) => `Từ ga ${s} có xe buýt nào đi Đại học Quốc gia không?`,
    answer: (s) =>
      `Quanh ga ${s} có các tuyến buýt kết nối, xem danh sách trạm và tuyến trong mục Tiện ích quanh ga.`,
  },
  {
    intent: "NEARBY_FACILITY",
    action: "getNearbyFacilities",
    weight: 7,
    ask: (s) => `Quanh ga ${s} có ATM nào không?`,
    answer: (s) =>
      `Quanh ga ${s} có một số ATM trong bán kính 300 m, xem chi tiết trên bản đồ tiện ích.`,
  },
  {
    intent: "MY_TICKETS",
    action: "getMyTickets",
    weight: 11,
    ask: () => "Vé tháng của tôi còn hạn đến khi nào?",
    answer: () => "Vé tháng của bạn còn hiệu lực đến ngày 14/11/2026.",
  },
  {
    intent: "MY_LOYALTY",
    action: "getMyLoyalty",
    weight: 6,
    ask: () => "Tôi còn bao nhiêu điểm tích lũy?",
    answer: () => "Bạn có 1.240 điểm, hạng Bạc. Còn 760 điểm để lên hạng Vàng.",
  },
  {
    intent: "FAQ",
    action: "searchFaq",
    weight: 6,
    faqId: "FAQ-03",
    ask: () => "Vào ga bằng vé trên điện thoại thế nào?",
    answer: () =>
      "Mở mục Vé của tôi, chọn vé còn hiệu lực và đưa mã QR cho cổng soát vé quét khi vào ga.",
  },
  {
    intent: "FAQ",
    action: "searchFaq",
    weight: 4,
    faqId: "FAQ-02",
    ask: () => "Vé ngày khác vé tháng chỗ nào?",
    answer: () =>
      "Vé ngày đi không giới hạn trong 24 giờ; vé tháng có hiệu lực 30 ngày kể từ ngày kích hoạt.",
  },
  {
    intent: "FAQ",
    action: "searchFaq",
    weight: 3,
    faqId: "FAQ-04",
    ask: () => "Mấy giờ có chuyến tàu cuối?",
    answer: () => "Tuyến 1 hiện chạy từ 05:00 đến 22:00.",
  },
  {
    intent: "OUT_OF_SCOPE",
    action: null,
    weight: 2,
    ask: () => "Thời tiết hôm nay thế nào?",
    answer: () => "Mình chỉ hỗ trợ thông tin về tuyến, ga, giá vé, vé và điểm tích lũy của bạn.",
  },
];

/** Câu hỏi bot không nhận diện được ý định (intent = null) — nguồn cho mục "Câu hỏi chưa nhận diện được". */
const UNRECOGNIZED = [
  "Mang thú cưng lên tàu được không?",
  "Xuất hóa đơn VAT cho vé tháng ở đâu?",
  "Quên điện thoại thì vào ga bằng gì?",
  "Có wifi miễn phí trên tàu không?",
  "Đổi tên chủ vé tháng được không?",
  "Trẻ em dưới 6 tuổi có phải mua vé không?",
];
const UNRECOGNIZED_WEIGHTS = [8, 6, 5, 3, 2, 4];
const FALLBACK_ANSWER =
  "Xin lỗi, mình chưa hiểu câu hỏi. Bạn có thể hỏi về tuyến, ga, giá vé, vé hoặc điểm tích lũy.";

const PASSENGERS = [
  "Nguyễn Hoài Nam",
  "Trần Bảo Ngọc",
  "Lê Quang Vinh",
  "Phạm Thu Trang",
  "Huỳnh Đức Anh",
  "Võ Minh Thư",
];
/** Ngày cuối của log mẫu. */
export const CHATBOT_TODAY = "2026-10-27";
const pad = (n: number) => String(n).padStart(2, "0");

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

function generate() {
  const r = seeded(142026);
  const active = stations.filter((s) => s.status === "ACTIVE").map((s) => s.name);
  const total = TEMPLATES.reduce((a, t) => a + t.weight, 0);
  const pickTemplate = () => {
    let x = r() * total;
    return TEMPLATES.find((t) => (x -= t.weight) < 0) ?? TEMPLATES[0];
  };
  const pickUnrecognized = () => {
    let x = r() * UNRECOGNIZED_WEIGHTS.reduce((a, b) => a + b, 0);
    return UNRECOGNIZED[UNRECOGNIZED_WEIGHTS.findIndex((w) => (x -= w) < 0)] ?? UNRECOGNIZED[0];
  };
  const sessions: ChatbotSession[] = [];
  const messages: ChatbotMessage[] = [];
  let sid = 0;
  let mid = 0;
  for (let back = 29; back >= 0; back--) {
    const d = new Date(2026, 9, 27 - back);
    const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const count = 18 + Math.floor(r() * 14);
    for (let k = 0; k < count; k++) {
      sid++;
      const hour = 6 + Math.floor(r() * 16);
      let minute = Math.floor(r() * 50);
      const stamp = () => `${day} ${pad(hour)}:${pad(Math.min(59, minute))}`;
      const id = `CS${10000 + sid}`;
      const questions = 1 + Math.floor(r() * 3);
      const startedAt = stamp();
      for (let q = 0; q < questions; q++) {
        const recognized = r() > 0.08;
        const t = pickTemplate();
        const s = active[Math.floor(r() * active.length)];
        const e = active[Math.floor(r() * active.length)];
        messages.push({
          id: `M${++mid}`,
          sessionId: id,
          sender: "USER",
          content: recognized ? t.ask(s, e) : pickUnrecognized(),
          intent: null,
          confidence: null,
          actionCalled: null,
          responseTimeMs: null,
          feedback: null,
          createdAt: stamp(),
        });
        const latency = Math.round(
          700 + r() * 1500 + (recognized && t.action ? 300 : 0) + (r() < 0.04 ? 2600 : 0),
        );
        const fb = r() < 0.18 ? (r() < (recognized ? 0.86 : 0.25) ? "LIKE" : "DISLIKE") : null;
        messages.push({
          id: `M${++mid}`,
          sessionId: id,
          sender: "BOT",
          content: recognized ? t.answer(s, e) : FALLBACK_ANSWER,
          intent: recognized ? t.intent : null,
          confidence: recognized
            ? Math.round((0.62 + r() * 0.37) * 1000) / 1000
            : Math.round((0.18 + r() * 0.3) * 1000) / 1000,
          actionCalled: recognized ? t.action : null,
          faqId: recognized ? t.faqId : undefined,
          responseTimeMs: latency,
          feedback: fb,
          createdAt: stamp(),
        });
        minute += 1;
      }
      const live = back === 0 && k > count - 4;
      sessions.push({
        id,
        sessionToken: `tok_${(sid * 7919).toString(36)}`,
        userId: `U${1000 + (sid % 36)}`,
        userName: PASSENGERS[sid % PASSENGERS.length],
        channel: r() < 0.75 ? "APP" : "WEB",
        startedAt,
        lastMessageAt: stamp(),
        endedAt: live ? undefined : stamp(),
        status: live ? "ACTIVE" : r() < 0.8 ? "CLOSED" : "EXPIRED",
      });
    }
  }
  return { sessions: sessions.reverse(), messages };
}

const generated = generate();
export const sessionsStore = createStore<ChatbotSession[]>(generated.sessions);
export const messagesStore = createStore<ChatbotMessage[]>(generated.messages);

/** Câu hỏi chưa nhận diện được mà Admin đã xử lý (thêm vào FAQ hoặc bỏ qua), theo nội dung câu hỏi. */
export const handledQuestionsStore = createStore<Record<string, "ADDED" | "IGNORED">>({});
