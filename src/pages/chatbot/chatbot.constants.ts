import type { ChatChannel, ChatIntent, FaqCategory, SessionStatus } from "@/mocks/chatbot";

export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  LINE: "Tuyến",
  STATION: "Nhà ga",
  FARE: "Giá vé",
  FACILITY: "Tiện ích",
  TICKET: "Vé",
  PARKING: "Gửi xe",
  LOYALTY: "Tích điểm",
  GUIDE: "Hướng dẫn sử dụng",
  OTHER: "Khác",
};

export const CHANNEL_LABELS: Record<ChatChannel, string> = { APP: "Ứng dụng", WEB: "Website" };

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  ACTIVE: "Đang trò chuyện",
  CLOSED: "Đã kết thúc",
  EXPIRED: "Hết hạn",
};

/** Ý định và use case tương ứng trong báo cáo (mục 3.2.3.14). */
export const INTENT_INFO: Record<ChatIntent, { label: string; group: string }> = {
  LINE_INFO: { label: "Thông tin tuyến", group: "UC14-01 · Tuyến, ga, giá vé" },
  STATION_INFO: { label: "Thông tin ga", group: "UC14-01 · Tuyến, ga, giá vé" },
  FARE_QUERY: { label: "Giá vé", group: "UC14-01 · Tuyến, ga, giá vé" },
  NEARBY_FACILITY: { label: "Tiện ích quanh ga", group: "UC14-02 · Tiện ích & xe buýt" },
  BUS_CONNECTION: { label: "Xe buýt kết nối", group: "UC14-02 · Tiện ích & xe buýt" },
  MY_TICKETS: { label: "Vé của tôi", group: "UC14-03 · Vé & điểm của tôi" },
  MY_LOYALTY: { label: "Điểm tích lũy", group: "UC14-03 · Vé & điểm của tôi" },
  FAQ: { label: "Câu hỏi thường gặp", group: "Kho tri thức (FAQ)" },
  OUT_OF_SCOPE: { label: "Ngoài phạm vi", group: "Ngoài phạm vi hỗ trợ" },
};

/** Yêu cầu phi chức năng của UC14-01/02/03: chatbot phản hồi không quá 3 giây. */
export const RESPONSE_LIMIT_MS = 3000;
