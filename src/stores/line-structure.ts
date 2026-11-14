// Kết cấu công trình của tuyến (ngầm / trên cao / đồng mức) và depot.
// Backend chưa có API hồ sơ tuyến: ga chưa khai báo được coi là đồng mức, tuyến chưa có depot.
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

/** Kết cấu theo mã ga. */
export const stationStructures: Record<string, TrackStructure> = {};

export function stationStructure(stationId: string): TrackStructure {
  return stationStructures[stationId] ?? "AT_GRADE";
}

export type Depot = { name: string; lat: number; lng: number };

export const lineDepots: Record<string, Depot> = {};
