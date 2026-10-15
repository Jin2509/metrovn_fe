import { createStore } from "@/lib/store";
import {
  lines as baseLines,
  lineStations as baseLineStations,
  stations as baseStations,
  type MetroLine,
  type Station,
} from "./metro";

// Ga/tuyến do quản trị viên thêm (sau khi xác nhận). Thay bằng API thật sau.
export const networkStore = createStore<{
  stations: Station[];
  lines: (MetroLine & { stationIds: string[] })[];
}>({ stations: [], lines: [] });

export function useNetwork() {
  const n = networkStore.use();
  const allStations = [...baseStations, ...n.stations];
  const allLines: MetroLine[] = [...baseLines, ...n.lines];
  const pathOf = (id: string): Station[] => {
    const custom = n.lines.find((l) => l.id === id);
    if (custom)
      return custom.stationIds.map((s) => allStations.find((x) => x.id === s)!).filter(Boolean);
    const base = baseLineStations(id);
    const extra = n.stations
      .filter((s) => s.lineIds.includes(id))
      .sort((a, b) => a.order - b.order);
    return [...base, ...extra];
  };
  return { stations: allStations, lines: allLines, pathOf };
}
