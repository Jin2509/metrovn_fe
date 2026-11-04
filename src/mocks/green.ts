import { createStore } from "@/lib/store";

// Hành trình xanh (GIẢ LẬP): backend chưa có API, số mặc định lấy đúng từ app mobile
// (`features/green/domain/green_impact.dart`, `booking_fake_source.dart`).

export type GreenTierId = "SEED" | "SPROUT" | "TREE" | "FOREST";

export type GreenTier = {
  id: GreenTierId;
  name: string;
  /** Mốc lên cấp theo lượng CO₂ đã bớt tích lũy (kg). */
  fromKg: number;
  /** Mức giảm trên các loại vé trong phạm vi áp dụng (%). */
  discountPercent: number;
};

export type GreenFactors = {
  /** Lưới điện Việt Nam, kg CO₂/kWh. */
  gridKgPerKwh: number;
  /** Điện năng cho mỗi km của một hành khách Metro, kWh. */
  metroKwhPerKm: number;
  /** Xe máy tiêu thụ, lít/100 km. */
  motorbikeLitrePer100Km: number;
  /** Xăng phát thải, kg CO₂/lít. */
  petrolKgPerLitre: number;
  /** Ô tô xăng, kg CO₂/km trên cả xe. */
  carKgPerKm: number;
  /** Số người trung bình trên ô tô. */
  peoplePerCar: number;
  /** Lượng CO₂ một cây xanh hấp thụ mỗi năm, kg. */
  treeKgPerYear: number;
};

/** SEQUENTIAL: lần lượt giảm trên phần còn lại (cách mobile đang tính). BEST_ONLY: chỉ lấy mức cao nhất. */
export type OfferCombineMode = "SEQUENTIAL" | "BEST_ONLY";

export type OfferPolicy = {
  /** Loại vé được giảm theo cấp CPoint. */
  tierTicketTypeIds: string[];
  /** Ưu đãi sinh viên đã xác nhận. */
  studentPercent: number;
  studentTicketTypeIds: string[];
  combineMode: OfferCombineMode;
  /** Tổng mức giảm tối đa trên một vé (%); 100 là không giới hạn. */
  maxTotalPercent: number;
};

export type GreenConfig = {
  /** Số CPoint cho mỗi kg CO₂ đã bớt. */
  cpointPerKg: number;
  factors: GreenFactors;
  tiers: GreenTier[];
  policy: OfferPolicy;
};

/** Vé tháng HSSV (MONTH_STUDENT) chỉ bán cho người đã xác nhận sinh viên. */
export const STUDENT_ONLY_TICKET_ID = "TT5";

export const DEFAULT_GREEN_CONFIG: GreenConfig = {
  cpointPerKg: 100,
  factors: {
    gridKgPerKwh: 0.681,
    metroKwhPerKm: 0.05,
    motorbikeLitrePer100Km: 2.7,
    petrolKgPerLitre: 2.31,
    carKgPerKm: 0.162,
    peoplePerCar: 1.6,
    treeKgPerYear: 21,
  },
  tiers: [
    { id: "SEED", name: "Hạt mầm", fromKg: 0, discountPercent: 0 },
    { id: "SPROUT", name: "Chồi non", fromKg: 1, discountPercent: 3 },
    { id: "TREE", name: "Cây xanh", fromKg: 5, discountPercent: 5 },
    { id: "FOREST", name: "Khu rừng", fromKg: 20, discountPercent: 8 },
  ],
  policy: {
    tierTicketTypeIds: ["TT1", "TT2", "TT3", "TT4", "TT5"],
    studentPercent: 20,
    studentTicketTypeIds: ["TT1"],
    combineMode: "SEQUENTIAL",
    maxTotalPercent: 100,
  },
};

export const greenConfigStore = createStore<GreenConfig>(DEFAULT_GREEN_CONFIG);
