import { parkingLots } from "./admin";
import { stations } from "./metro";

// Bảng sự kiện (fact table) đã tổng hợp theo NGÀY × GA — đúng dạng backend nên trả về cho bài toán
// nhiều ga/chi nhánh: giao diện chỉ cộng dồn bản ghi đã gom sẵn, không phải quét từng giao dịch.
export type StationDailyStat = {
  date: string; // yyyy-mm-dd
  stationId: string;
  entries: number; // lượt vào cổng
  exits: number; // lượt ra cổng
  ticketRevenue: number;
  parkingRevenue: number;
  refund: number;
};

export const STATION_STATS_RANGE = { from: "2026-09-15", to: "2026-10-14" } as const;

// Số giả ngẫu nhiên tất định (cùng đầu vào → cùng kết quả) để dữ liệu ổn định giữa các lần render/test.
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= end; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

const parkingCapacity = new Map(parkingLots.map((lot) => [lot.stationId, lot.moto + lot.car]));

export const stationDailyStats: StationDailyStat[] = dateRange(
  STATION_STATS_RANGE.from,
  STATION_STATS_RANGE.to,
).flatMap((date, dayIndex) => {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const dayFactor = weekday === 0 ? 0.72 : weekday === 6 ? 0.85 : 1;
  return stations
    .filter((station) => station.status === "ACTIVE")
    .map((station, stationIndex) => {
      const seed = dayIndex * 101 + stationIndex * 7 + 1;
      const entries = Math.round(station.dailyFlow * dayFactor * (0.85 + noise(seed) * 0.3));
      const exits = Math.round(entries * (0.92 + noise(seed + 1) * 0.16));
      // Giá vé bình quân tăng dần theo khoảng cách tới trung tâm (Bến Thành).
      const avgFare = 7000 + station.order * 600;
      const capacity = parkingCapacity.get(station.id) ?? 0;
      const parkingRevenue = Math.round(capacity * (0.5 + noise(seed + 2) * 0.4)) * 5000;
      const ticketRevenue = entries * avgFare;
      return {
        date,
        stationId: station.id,
        entries,
        exits,
        ticketRevenue,
        parkingRevenue,
        refund: Math.round(ticketRevenue * noise(seed + 3) * 0.01),
      };
    });
});
