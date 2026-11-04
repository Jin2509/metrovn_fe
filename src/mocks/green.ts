import { createStore } from "@/lib/store";

// Hành trình xanh (GIẢ LẬP): backend chưa có API. CPoint khuyến khích đi Metro nhiều hơn để giảm CO₂,
// nên mỗi lần check-in tại ga được cộng đúng số điểm của loại vé đang dùng. Không có vé lượt.

export type GreenTierId = "SEED" | "SPROUT" | "TREE" | "FOREST";

export type GreenTier = {
  id: GreenTierId;
  name: string;
  /** Mốc CPoint tích lũy để lên cấp. */
  fromCpoint: number;
  /** Mức giảm trên các loại vé trong phạm vi áp dụng (%). */
  discountPercent: number;
};

export type OfferPolicy = {
  /** Loại vé được giảm theo cấp CPoint. */
  tierTicketTypeIds: string[];
  /** Chính sách sinh viên cho người đã xác nhận. */
  studentPercent: number;
  studentTicketTypeIds: string[];
};

export type GreenConfig = {
  /** Số CPoint cộng mỗi lần check-in, theo mã loại vé. Loại vé chưa khai báo được 0 điểm. */
  checkinPoints: Record<string, number>;
  tiers: GreenTier[];
  policy: OfferPolicy;
};

/** Vé tháng HSSV (MONTH_STUDENT) chỉ bán cho người đã xác nhận sinh viên. */
export const STUDENT_ONLY_TICKET_ID = "TT5";

export const DEFAULT_GREEN_CONFIG: GreenConfig = {
  checkinPoints: { TT2: 10, TT3: 30, TT4: 100, TT5: 100 },
  tiers: [
    { id: "SEED", name: "Hạt mầm", fromCpoint: 0, discountPercent: 0 },
    { id: "SPROUT", name: "Chồi non", fromCpoint: 100, discountPercent: 3 },
    { id: "TREE", name: "Cây xanh", fromCpoint: 500, discountPercent: 5 },
    { id: "FOREST", name: "Khu rừng", fromCpoint: 2000, discountPercent: 8 },
  ],
  policy: {
    tierTicketTypeIds: ["TT2", "TT3", "TT4", "TT5"],
    studentPercent: 20,
    studentTicketTypeIds: ["TT2", "TT3", "TT4"],
  },
};

export const greenConfigStore = createStore<GreenConfig>(DEFAULT_GREEN_CONFIG);
