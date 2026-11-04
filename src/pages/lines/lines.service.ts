import { haversine } from "@/lib/geo";
import {
  lineDepots,
  STRUCTURE_LEVEL_M,
  stationStructure,
  type TrackStructure,
} from "@/mocks/line-structure";
import type { LineStation, Station } from "@/mocks/metro";
import type {
  Line3DModel,
  Line3DNode,
  Line3DSegment,
  SegmentStructure,
} from "@/pages/lines/lines.types";

export type DistanceBracket = { from: number; to: number; price: number };

/** Giá vé lượt theo cự ly (bảng ticket_price): bậc có from < cự ly ≤ to; vượt bậc cuối thì lấy bậc cuối. */
export function fareForDistance(km: number, brackets: DistanceBracket[]) {
  const sorted = [...brackets].sort((a, b) => a.to - b.to);
  return sorted.find((b) => km <= b.to) ?? sorted.at(-1)!;
}

/** Sắp lại số thứ tự liên tục 1..n theo vị trí hiện tại trong danh sách. */
export const renumber = (rows: LineStation[]) => rows.map((r, i) => ({ ...r, order: i + 1 }));

export function moveRow(rows: LineStation[], from: number, to: number) {
  if (to < 0 || to >= rows.length) return rows;
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return renumber(next);
}

const METERS_PER_DEG_LAT = 110_540;

/**
 * Dựng mô hình 3D của tuyến theo thứ tự ga đang chỉnh: các ga (lý trình, kết cấu, cao độ), các đoạn
 * ray giữa 2 ga liên tiếp và depot. Lý trình lấy từ bảng line_station để khớp "Tổng hợp tuyến".
 */
export function buildLine3DModel(
  rows: (Pick<LineStation, "stationId"> & { km: number })[],
  stations: Station[],
  lineId: string,
): Line3DModel {
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const path = rows.flatMap((row) => {
    const station = stationById.get(row.stationId);
    return station ? [{ station, km: row.km }] : [];
  });
  const depot = lineDepots[lineId];
  const points: { lat: number; lng: number }[] = path.map((p) => p.station);
  if (depot) points.push(depot);
  const lat0 = points.reduce((sum, p) => sum + p.lat, 0) / (points.length || 1);
  const lng0 = points.reduce((sum, p) => sum + p.lng, 0) / (points.length || 1);
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  const toLocal = (p: { lat: number; lng: number }) => ({
    x: (p.lng - lng0) * metersPerDegLng,
    y: (p.lat - lat0) * METERS_PER_DEG_LAT,
  });

  const nodes: Line3DNode[] = path.map(({ station, km }, index) => {
    const structure = stationStructure(station.id);
    return {
      id: station.id,
      name: station.name,
      no: index + 1,
      kind: "STATION",
      structure,
      interchange: station.interchange,
      chainageKm: km,
      z: STRUCTURE_LEVEL_M[structure],
      ...toLocal(station),
    };
  });

  const last = nodes.at(-1);
  const depotNode: Line3DNode | null =
    depot && last
      ? {
          id: `${lineId}-DEPOT`,
          name: depot.name,
          no: nodes.length + 1,
          kind: "DEPOT",
          structure: "AT_GRADE",
          interchange: false,
          chainageKm: last.chainageKm + haversine(path.at(-1)!.station, depot) / 1000,
          z: STRUCTURE_LEVEL_M.AT_GRADE,
          ...toLocal(depot),
        }
      : null;

  const segments: Line3DSegment[] = nodes.slice(1).map((to, index) => {
    const from = nodes[index];
    return {
      from,
      to,
      lengthKm: to.chainageKm - from.chainageKm,
      structure: segmentStructure(from.structure, to.structure),
    };
  });

  const lengthByStructure: Record<SegmentStructure, number> = {
    UNDERGROUND: 0,
    ELEVATED: 0,
    AT_GRADE: 0,
    TRANSITION: 0,
  };
  for (const segment of segments) lengthByStructure[segment.structure] += segment.lengthKm;

  const allNodes = depotNode ? [...nodes, depotNode] : nodes;
  const radius = Math.max(500, ...allNodes.map((node) => Math.hypot(node.x, node.y)));

  return {
    nodes,
    depot: depotNode,
    segments,
    totalKm: last?.chainageKm ?? 0,
    lengthByStructure,
    radius,
  };
}

function segmentStructure(from: TrackStructure, to: TrackStructure): SegmentStructure {
  return from === to ? from : "TRANSITION";
}

const LABEL_CHAR_W = 6;
const LABEL_H = 14;

/**
 * Chọn nhãn ga để hiện sao cho không đè lên nhau: ga đang chọn, ga chuyển tuyến và hai ga đầu cuối được
 * ưu tiên. Ga bị ẩn nhãn vẫn xem được khi rê chuột, bấm chọn hoặc phóng to.
 */
export function visibleLabelIds(
  labels: { id: string; text: string; x: number; y: number; priority: boolean }[],
) {
  const placed: { x: number; y: number; w: number }[] = [];
  const visible = new Set<string>();
  const ordered = [...labels.filter((l) => l.priority), ...labels.filter((l) => !l.priority)];
  for (const label of ordered) {
    const w = label.text.length * LABEL_CHAR_W;
    const hit = placed.some(
      (p) => label.x < p.x + p.w && p.x < label.x + w && Math.abs(label.y - p.y) < LABEL_H,
    );
    if (hit) continue;
    placed.push({ x: label.x, y: label.y, w });
    visible.add(label.id);
  }
  return visible;
}
