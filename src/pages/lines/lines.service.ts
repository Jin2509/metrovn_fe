import {
  ApiError,
  type CreateLineBody,
  type LineResponse,
  type LineStationResponse,
  type LineStatus,
  type StationOrderItem,
  type UpdateLineBody,
} from "@/lib/api";
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

// ---------- Tuyến & ga trên tuyến (API /api/v1) ----------

/**
 * Ga có đoạn nối từ ga trước vừa bị backend tính lại sau khi thêm/xoá/sắp xếp: ga mới, ga có ga
 * liền trước thay đổi, hoặc số liệu đoạn thay đổi. Bỏ qua ga đầu tuyến (luôn là 0).
 * Giá trị tự tính chỉ là ước lượng đường chim bay nên cần nhắc admin kiểm tra lại.
 */
export function recalculatedStationIds(
  before: LineStationResponse[],
  after: LineStationResponse[],
): number[] {
  const prev = new Map(
    before.map((row, i) => [row.station.id, { row, prevId: before[i - 1]?.station.id }]),
  );
  return after.flatMap((row, i) => {
    if (i === 0) return [];
    const old = prev.get(row.station.id);
    const changed =
      !old ||
      old.prevId !== after[i - 1].station.id ||
      old.row.distanceFromPrevKm !== row.distanceFromPrevKm ||
      old.row.travelTimeFromPrevSeconds !== row.travelTimeFromPrevSeconds;
    return changed ? [row.station.id] : [];
  });
}

/** Lý trình (km) và thời gian chạy cộng dồn (giây, gồm thời gian dừng ở các ga giữa). */
export function lineTotals(rows: LineStationResponse[]) {
  let km = 0;
  let sec = 0;
  const chainage = rows.map((row, i) => {
    if (i > 0) {
      km += row.distanceFromPrevKm;
      sec += row.travelTimeFromPrevSeconds + (i > 1 ? rows[i - 1].dwellTimeSeconds : 0);
    }
    return { stationId: row.station.id, km, sec };
  });
  return { chainage, km, sec };
}

/** Thời gian ước tính giữa ga i và ga j (i < j, theo chỉ số mảng). */
export function travelSecondsBetween(rows: LineStationResponse[], i: number, j: number) {
  let sec = 0;
  for (let k = i + 1; k <= j; k++) sec += rows[k].travelTimeFromPrevSeconds;
  for (let k = i + 1; k < j; k++) sec += rows[k].dwellTimeSeconds;
  return sec;
}

export function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export const toOrderItems = (stationIds: number[]): StationOrderItem[] =>
  stationIds.map((stationId, i) => ({ stationId, stationOrder: i + 1 }));

export const LINE_STATUS_LABELS: Record<LineStatus, string> = {
  ACTIVE: "Đang khai thác",
  UNDER_CONSTRUCTION: "Đang xây dựng",
  INACTIVE: "Ngừng khai thác",
};

export type LineDraft = {
  code: string;
  name: string;
  colorHex: string;
  description: string;
  status: LineStatus;
};
export type LineErrors = Partial<Record<keyof LineDraft, string>>;

export const EMPTY_LINE_DRAFT: LineDraft = {
  code: "",
  name: "",
  colorHex: "#00AEEF",
  description: "",
  status: "UNDER_CONSTRUCTION",
};

export const toLineDraft = (line: LineResponse): LineDraft => ({
  code: line.code,
  name: line.nameLine,
  colorHex: line.colorHex ?? "",
  description: line.description ?? "",
  status: line.status,
});

export function validateLineDraft(
  draft: LineDraft,
  all: LineResponse[],
  editingId?: number,
): LineErrors {
  const errors: LineErrors = {};
  const code = draft.code.trim();
  if (!code) errors.code = "Vui lòng nhập mã tuyến";
  else if (code.length > 20) errors.code = "Mã tuyến tối đa 20 ký tự";
  else if (all.some((l) => l.id !== editingId && l.code.toLowerCase() === code.toLowerCase()))
    errors.code = "Mã tuyến đã tồn tại";
  const name = draft.name.trim();
  if (!name) errors.name = "Vui lòng nhập tên tuyến";
  else if (name.length > 100) errors.name = "Tên tuyến tối đa 100 ký tự";
  const color = draft.colorHex.trim();
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) errors.colorHex = "Màu phải có dạng #RRGGBB";
  return errors;
}

export const buildCreateLineBody = (draft: LineDraft): CreateLineBody => ({
  code: draft.code.trim(),
  nameLine: draft.name.trim(),
  colorHex: draft.colorHex.trim() || undefined,
  description: draft.description.trim() || undefined,
  status: draft.status,
});

/** Chỉ gửi field đã đổi; `""` ở colorHex/description để xoá giá trị. */
export function buildUpdateLineBody(draft: LineDraft, current: LineResponse): UpdateLineBody {
  const body: UpdateLineBody = {};
  if (draft.code.trim() !== current.code) body.code = draft.code.trim();
  if (draft.name.trim() !== current.nameLine) body.nameLine = draft.name.trim();
  if (draft.colorHex.trim() !== (current.colorHex ?? "")) body.colorHex = draft.colorHex.trim();
  if (draft.description.trim() !== (current.description ?? ""))
    body.description = draft.description.trim();
  if (draft.status !== current.status) body.status = draft.status;
  return body;
}

/** Lỗi từ backend → lỗi theo ô nhập; `null` nếu không gắn được vào ô nào. */
export function lineErrorsFromApi(error: unknown): LineErrors | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 409) return { code: error.detail || "Mã tuyến đã tồn tại" };
  if (error.status !== 400) return null;
  const map: Record<string, keyof LineDraft> = {
    code: "code",
    nameLine: "name",
    colorHex: "colorHex",
    description: "description",
    status: "status",
  };
  const errors: LineErrors = {};
  for (const [field, message] of Object.entries(error.fieldErrors))
    if (map[field]) errors[map[field]] = message;
  return Object.keys(errors).length ? errors : null;
}
