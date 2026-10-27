import { describe, expect, it } from "vitest";

import { runningTimeMinutes } from "@/lib/network";
import { simulateTrains } from "@/lib/train-simulation";
import { lineStationRows, stations } from "@/mocks/metro";

const rows = lineStationRows("L1");
const config = { startTime: "05:00", endTime: "22:00", headwayMinutes: 6 };
const at = (h: number, m: number, s = 0) => new Date(2026, 9, 27, h, m, s);

describe("simulateTrains", () => {
  it("không có tàu ngoài giờ vận hành", () => {
    expect(simulateTrains(config, rows, stations, at(4, 59))).toEqual([]);
    const afterLast = runningTimeMinutes("L1") + 2;
    expect(simulateTrains(config, rows, stations, at(22, afterLast))).toEqual([]);
  });

  it("đúng giờ mở tuyến: mỗi đầu tuyến có một tàu đang dừng ở ga xuất phát", () => {
    const trains = simulateTrains(config, rows, stations, at(5, 0));
    expect(trains).toHaveLength(2);
    expect(trains.find((t) => t.direction === "FORWARD")?.atStationId).toBe("S1-1");
    expect(trains.find((t) => t.direction === "BACKWARD")?.atStationId).toBe("S1-14");
  });

  it("giữa ngày số tàu trên tuyến ≈ 2 × thời gian chạy ÷ giãn cách", () => {
    const trains = simulateTrains(config, rows, stations, at(12, 3));
    const expected = (2 * runningTimeMinutes("L1")) / 6;
    expect(Math.abs(trains.length - expected)).toBeLessThanOrEqual(2);
    // Mọi tàu nằm trong khung tọa độ của tuyến.
    for (const t of trains) {
      expect(t.lat).toBeGreaterThan(10.77);
      expect(t.lat).toBeLessThan(10.88);
    }
  });

  it("tàu giữa hai ga có ga kế tiếp và vị trí nằm giữa hai ga", () => {
    const trains = simulateTrains(config, rows, stations, at(5, 1, 30));
    const fwd = trains.find((t) => t.direction === "FORWARD")!;
    expect(fwd.atStationId).toBeUndefined();
    expect(fwd.nextStationId).toBe("S1-2");
    const a = stations.find((s) => s.id === "S1-1")!;
    const b = stations.find((s) => s.id === "S1-2")!;
    expect(fwd.lat).toBeGreaterThanOrEqual(Math.min(a.lat, b.lat));
    expect(fwd.lat).toBeLessThanOrEqual(Math.max(a.lat, b.lat));
  });
});
