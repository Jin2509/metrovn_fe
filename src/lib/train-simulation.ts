import { chainage } from "@/lib/network";
import type { LineStation, Station } from "@/mocks/metro";
import type { OperationConfig } from "@/mocks/operations";

// Mô phỏng vị trí tàu theo lịch (mục tiêu "theo dõi vị trí tàu được mô phỏng" của báo cáo).
// Không phải GPS: vị trí suy ra từ cấu hình vận hành đang áp dụng (giờ chạy, giãn cách) và bảng
// line_station (thời gian chạy giữa hai ga, thời gian dừng). Khi có backend, server tính và đẩy
// qua WebSocket; giao diện chỉ cần thay nguồn dữ liệu.

export type SimulatedTrain = {
  id: string;
  direction: "FORWARD" | "BACKWARD";
  lat: number;
  lng: number;
  /** Đang dừng tại ga này (nếu có). */
  atStationId?: string;
  /** Ga sắp tới. */
  nextStationId?: string;
  /** Giờ rời ga đầu của chuyến (HH:MM). */
  departedAt: string;
};

const toSec = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 3600 + m * 60;
};
const hhmm = (sec: number) =>
  `${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}`;

type Point = { id: string; lat: number; lng: number; arrive: number; leave: number };

/** Mốc đến/rời từng ga tính từ lúc rời ga đầu (giây). */
function timeline(rows: LineStation[], stations: Station[]): Point[] {
  return chainage(rows).map((r, i) => {
    const s = stations.find((x) => x.id === r.stationId)!;
    // Ga đầu: rời ngay (mốc 0); các ga sau dừng dwellSec trước khi chạy tiếp.
    return {
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      arrive: r.sec,
      leave: i === 0 ? 0 : r.sec + r.dwellSec,
    };
  });
}

function locate(points: Point[], elapsed: number) {
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (elapsed >= p.arrive && elapsed <= p.leave)
      return { lat: p.lat, lng: p.lng, atStationId: p.id, nextStationId: points[i + 1]?.id };
    const next = points[i + 1];
    if (next && elapsed > p.leave && elapsed < next.arrive) {
      const t = (elapsed - p.leave) / (next.arrive - p.leave);
      return {
        lat: p.lat + (next.lat - p.lat) * t,
        lng: p.lng + (next.lng - p.lng) * t,
        nextStationId: next.id,
      };
    }
  }
  return null;
}

/** Vị trí các đoàn tàu đang chạy trên tuyến tại thời điểm `now`. */
export function simulateTrains(
  config: Pick<OperationConfig, "startTime" | "endTime" | "headwayMinutes">,
  rows: LineStation[],
  stations: Station[],
  now: Date,
): SimulatedTrain[] {
  if (rows.length < 2) return [];
  const forward = timeline(rows, stations);
  const duration = forward.at(-1)!.arrive;
  // Chiều ngược: đảo thứ tự ga; thời gian chạy giữa hai ga giống chiều đi.
  const backwardRows = [...rows].reverse().map((r, i, arr) => ({
    ...r,
    distanceFromPrevKm: i === 0 ? null : arr[i - 1].distanceFromPrevKm,
    travelTimeFromPrevSec: i === 0 ? null : arr[i - 1].travelTimeFromPrevSec,
  }));
  const backward = timeline(backwardRows, stations);

  const t = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const start = toSec(config.startTime);
  const end = toSec(config.endTime);
  const headway = config.headwayMinutes * 60;
  const out: SimulatedTrain[] = [];
  for (const [direction, points] of [
    ["FORWARD", forward],
    ["BACKWARD", backward],
  ] as const) {
    // Chuyến xuất phát tại start + k × giãn cách, chuyến cuối không muộn hơn giờ kết thúc.
    for (let dep = start; dep <= end; dep += headway) {
      const elapsed = t - dep;
      if (elapsed < 0) break;
      if (elapsed > duration) continue;
      const pos = locate(points, elapsed);
      if (pos)
        out.push({ id: `${direction[0]}${hhmm(dep)}`, direction, departedAt: hhmm(dep), ...pos });
    }
  }
  return out;
}
