import { haversine } from "@/lib/geo";
import { logAction } from "@/mocks/admin";
import {
  lineDepots,
  STRUCTURE_LEVEL_M,
  stationStructure,
  type TrackStructure,
} from "@/mocks/line-structure";
import type { Station } from "@/mocks/metro";
import type {
  Line3DModel,
  Line3DNode,
  Line3DSegment,
  SegmentStructure,
  StationOrder,
} from "@/pages/lines/lines.types";

export function saveStationOrder(order: StationOrder[], lineCode: string): StationOrder[] | null {
  const orderNumbers = order.map((station) => station.no).sort((a, b) => a - b);
  const isValid =
    orderNumbers.every((number, index) => number === index + 1) &&
    new Set(order.map((station) => station.id)).size === order.length;
  if (!isValid) return null;

  const sortedOrder = [...order].sort((a, b) => a.no - b.no);
  logAction("Sắp xếp thứ tự ga", lineCode);
  return sortedOrder;
}

const METERS_PER_DEG_LAT = 110_540;

/**
 * Dựng mô hình 3D của tuyến theo thứ tự ga hiện tại: Tuyến → các ga (lý trình, kết cấu, cao độ)
 * → các đoạn ray giữa 2 ga liên tiếp → depot. Tra cứu ga bằng Map nên O(số ga).
 */
export function buildLine3DModel(
  order: StationOrder[],
  stations: Station[],
  lineId: string,
): Line3DModel {
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const path = order
    .map((item) => stationById.get(item.id))
    .filter((station): station is Station => !!station);
  const depot = lineDepots[lineId];
  const points: { lat: number; lng: number }[] = depot ? [...path, depot] : path;
  const lat0 = points.reduce((sum, p) => sum + p.lat, 0) / (points.length || 1);
  const lng0 = points.reduce((sum, p) => sum + p.lng, 0) / (points.length || 1);
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  const toLocal = (p: { lat: number; lng: number }) => ({
    x: (p.lng - lng0) * metersPerDegLng,
    y: (p.lat - lat0) * METERS_PER_DEG_LAT,
  });

  let chainage = 0;
  const nodes: Line3DNode[] = path.map((station, index) => {
    if (index > 0) chainage += haversine(path[index - 1], station) / 1000;
    const structure = stationStructure(station.id);
    return {
      id: station.id,
      name: station.name,
      no: index + 1,
      kind: "STATION",
      structure,
      interchange: station.interchange,
      chainageKm: chainage,
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
          chainageKm: last.chainageKm + haversine(path.at(-1)!, depot) / 1000,
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
