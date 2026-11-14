import {
  lineStationRows,
  lineStationsStore,
  lines,
  stationsStore,
  type LineStation,
  type StationStatus,
} from "@/stores/metro";

// Tra cứu và tính toán trên dữ liệu mạng lưới (UC4). Ga, tuyến và thứ tự ga ghi thẳng lên backend
// (`stationsApi`, `linesApi`); dữ liệu ở đây được `useNetworkSync` nạp từ backend.

export const STATION_STATUS_LABELS: Record<StationStatus, string> = {
  ACTIVE: "Hoạt động",
  MAINTENANCE: "Bảo trì",
  INACTIVE: "Ngừng / chưa khai thác",
};

export const stationName = (id: string | undefined) =>
  stationsStore.get().find((s) => s.id === id)?.name ?? "—";
export const lineCode = (id: string | undefined) => lines.find((l) => l.id === id)?.code ?? "—";

// ---------- Tuyến – ga ----------

/** Lý trình cộng dồn (km) và thời gian chạy cộng dồn (giây, đã gồm thời gian dừng các ga trước). */
export function chainage(rows: LineStation[]) {
  let km = 0;
  let sec = 0;
  return rows.map((r, i) => {
    if (i > 0) {
      km += r.distanceFromPrevKm ?? 0;
      sec += (r.travelTimeFromPrevSec ?? 0) + rows[i - 1].dwellSec;
    }
    return { ...r, km, sec };
  });
}

/** Thời gian chạy một chiều (phút) = Σ thời gian chạy giữa các ga + Σ thời gian dừng ở các ga giữa. */
export function runningTimeMinutes(lineId: string, rows = lineStationsStore.get()) {
  const list = chainage(lineStationRows(lineId, rows));
  return Math.round((list.at(-1)?.sec ?? 0) / 60);
}

export const ORDER_ERROR = "Thứ tự ga không hợp lệ";

/**
 * Kiểm tra trước khi lưu thứ tự ga (UC4-01): số thứ tự liên tục từ 1, không trùng ga,
 * khoảng cách và thời gian chạy > 0 với mọi ga trừ ga đầu. Lưu toàn bộ hoặc không lưu gì.
 */
export function validateLineOrder(rows: LineStation[]): string[] {
  const errors: string[] = [];
  const orders = rows.map((r) => r.order).sort((a, b) => a - b);
  if (
    !orders.every((o, i) => o === i + 1) ||
    new Set(rows.map((r) => r.stationId)).size !== rows.length
  )
    errors.push(`${ORDER_ERROR}: số thứ tự bị trùng, thiếu hoặc lặp ga`);
  const sorted = [...rows].sort((a, b) => a.order - b.order);
  sorted.slice(1).forEach((r) => {
    if (
      !(r.distanceFromPrevKm && r.distanceFromPrevKm > 0) ||
      !(r.travelTimeFromPrevSec && r.travelTimeFromPrevSec > 0)
    )
      errors.push(`Ga thứ ${r.order}: khoảng cách và thời gian chạy từ ga trước phải lớn hơn 0`);
  });
  return errors;
}
