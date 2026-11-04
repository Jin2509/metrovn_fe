import { STRUCTURE_LABEL } from "@/mocks/line-structure";
import type { SegmentStructure } from "@/pages/lines/lines.types";

/** Góc nhìn dựng sẵn của mô hình 3D (độ). */
export const LINE_3D_PRESETS = {
  perspective: { yaw: -30, pitch: 58 },
  top: { yaw: 0, pitch: 0 },
  side: { yaw: 0, pitch: 82 },
} as const;

export const SEGMENT_STRUCTURE_LABEL: Record<SegmentStructure, string> = {
  ...STRUCTURE_LABEL,
  TRANSITION: "Đoạn chuyển tiếp",
};
