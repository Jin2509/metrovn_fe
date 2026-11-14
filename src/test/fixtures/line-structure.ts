// Kết cấu công trình của tuyến (ngầm / trên cao / đồng mức) và depot — thay bằng API hồ sơ tuyến sau.
// Tuyến 1: Bến Thành → Ba Son đi ngầm, Văn Thánh → Suối Tiên đi trên cao, depot Long Bình đồng mức.
// Tuyến 2 (giai đoạn 1): toàn tuyến đi ngầm, depot Tham Lương đồng mức.
export type TrackStructure = "UNDERGROUND" | "ELEVATED" | "AT_GRADE";

/** Cao độ ray tiêu chuẩn so với mặt đất (m). */
export const STRUCTURE_LEVEL_M: Record<TrackStructure, number> = {
  UNDERGROUND: -18,
  AT_GRADE: 0,
  ELEVATED: 12,
};

export const STRUCTURE_LABEL: Record<TrackStructure, string> = {
  UNDERGROUND: "Ngầm",
  AT_GRADE: "Đồng mức",
  ELEVATED: "Trên cao",
};

const UNDERGROUND_STATIONS = new Set(["S1-1", "S1-2", "S1-3"]);

export function stationStructure(stationId: string): TrackStructure {
  if (UNDERGROUND_STATIONS.has(stationId) || stationId.startsWith("S2-")) return "UNDERGROUND";
  return "ELEVATED";
}

export type Depot = { name: string; lat: number; lng: number };

export const lineDepots: Record<string, Depot> = {
  L1: { name: "Depot Long Bình", lat: 10.8862, lng: 106.8262 },
  L2: { name: "Depot Tham Lương", lat: 10.8306, lng: 106.6205 },
};
