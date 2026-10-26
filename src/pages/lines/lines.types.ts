import type { TrackStructure } from "@/mocks/line-structure";
import type { Station } from "@/mocks/metro";

export type StationOrder = Pick<Station, "id" | "name"> & { no: number };

/** Kết cấu một đoạn ray: giữ nguyên kết cấu của 2 ga, hoặc đoạn dốc chuyển tiếp (cửa hầm/ram dốc). */
export type SegmentStructure = TrackStructure | "TRANSITION";

/** Điểm trong mô hình 3D: toạ độ cục bộ (m) quanh tâm tuyến, z = cao độ ray (m). */
export type Line3DNode = {
  id: string;
  name: string;
  no: number;
  kind: "STATION" | "DEPOT";
  structure: TrackStructure;
  interchange: boolean;
  chainageKm: number;
  x: number;
  y: number;
  z: number;
};

export type Line3DSegment = {
  from: Line3DNode;
  to: Line3DNode;
  lengthKm: number;
  structure: SegmentStructure;
};

export type Line3DModel = {
  nodes: Line3DNode[];
  depot: Line3DNode | null;
  segments: Line3DSegment[];
  totalKm: number;
  lengthByStructure: Record<SegmentStructure, number>;
  /** Bán kính bao (m) — dùng để tự co giãn khung nhìn. */
  radius: number;
};
