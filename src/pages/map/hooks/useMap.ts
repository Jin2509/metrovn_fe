import { useEffect, useMemo, useState } from "react";
import type { StationMarkerState } from "@/components/metro-map";
import { useAuth } from "@/lib/auth";
import { stationName } from "@/lib/network";
import { useOperationConfigsData } from "@/lib/operations.queries";
import { simulateTrains } from "@/lib/train-simulation";
import { announcementsStore } from "@/stores/announcements";
import {
  busVersionStore,
  lineStationRows,
  lineStationsStore,
  linesStore,
  stationsStore,
  stopsForStation,
} from "@/stores/metro";
import { operationConfigsStore } from "@/stores/operations";
import { useBusData } from "@/pages/map/hooks/useBusData";
import {
  activeForPassengers,
  useAnnouncementsData,
} from "@/pages/notifications/notifications.service";

/** Màu trên bản đồ (Leaflet không đọc được token CSS nên dùng mã màu cố định). */
export const MAP_COLORS = {
  normal: "#ffffff",
  info: "#38bdf8",
  warning: "#f59e0b",
  critical: "#ef4444",
  inactive: "#94a3b8",
};

const SIM_INTERVAL_MS = 5000;

export function useMap() {
  const { hasPermission } = useAuth();
  useOperationConfigsData();
  useAnnouncementsData(
    hasPermission("ANNOUNCEMENT_MANAGE") || hasPermission("ANNOUNCEMENT_APPROVE"),
  );
  const lines = linesStore.use();
  const [hiddenLines, setHiddenLines] = useState<string[]>([]);
  const visibleLines = lines.map((l) => l.id).filter((id) => !hiddenLines.includes(id));
  const [showBus, setShowBus] = useState(false);
  const [busRoute, setBusRoute] = useState<string | null>(null);
  const [showTrains, setShowTrains] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const stations = stationsStore.use();
  const bus = useBusData(stations, showBus);
  // Vẽ lại khi nạp xong dữ liệu xe buýt (bản đồ đọc thẳng mảng `busStops`).
  busVersionStore.use();
  const rows = lineStationsStore.use();
  const announcements = announcementsStore.use();
  const configs = operationConfigsStore.use();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), SIM_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const active = activeForPassengers(announcements, now);
  const activeConfigs = configs.filter((c) => c.status === "ACTIVE");
  // Cấu hình hiển thị ở thẻ số liệu: tuyến đầu tiên đang có cấu hình áp dụng.
  const config = lines.map((l) => activeConfigs.find((c) => c.lineId === l.id)).find((c) => !!c);

  const stationStates = useMemo(() => {
    const out: Record<string, StationMarkerState> = {};
    for (const s of stations) {
      if (s.status === "MAINTENANCE")
        out[s.id] = { fill: MAP_COLORS.warning, label: "Đang bảo trì" };
      else if (s.status === "INACTIVE")
        out[s.id] = { fill: MAP_COLORS.inactive, label: "Chưa khai thác" };
      const here = active.filter((a) => a.stationId === s.id);
      const worst =
        here.find((a) => a.severity === "CRITICAL") ??
        here.find((a) => a.severity === "WARNING") ??
        here[0];
      if (worst)
        out[s.id] = {
          fill:
            worst.severity === "CRITICAL"
              ? MAP_COLORS.critical
              : worst.severity === "WARNING"
                ? MAP_COLORS.warning
                : MAP_COLORS.info,
          label: worst.title,
        };
    }
    return out;
  }, [stations, active]);

  const simulated = useMemo(
    () =>
      activeConfigs.flatMap((c) => {
        const path = lineStationRows(c.lineId, rows);
        const first = stationName(path[0]?.stationId);
        const last = stationName(path.at(-1)?.stationId);
        return simulateTrains(c, path, stations, now).map((t) => ({
          id: `${c.lineId}-${t.id}`,
          lat: t.lat,
          lng: t.lng,
          label: `Chuyến ${t.departedAt} → ${t.direction === "FORWARD" ? last : first}${
            t.atStationId
              ? ` · đang dừng ga ${stationName(t.atStationId)}`
              : ` · sắp tới ga ${stationName(t.nextStationId)}`
          }`,
        }));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configs, rows, stations, now],
  );
  const trains = showTrains ? simulated : [];

  const station = stations.find((s) => s.id === selectedStationId);

  return {
    lines,
    visibleLines,
    setLineVisibility: (lineId: string, visible: boolean) =>
      setHiddenLines((cur) => (visible ? cur.filter((l) => l !== lineId) : [...cur, lineId])),
    busLoading: bus.loading,
    busError: bus.error,
    showBus,
    setShowBus,
    busRoute,
    setBusRoute,
    showTrains,
    setShowTrains,
    stationStates,
    trains,
    config,
    active,
    selectedStationId,
    selectStation: setSelectedStationId,
    selected: station
      ? {
          station,
          announcements: active.filter((a) => a.stationId === station.id),
          busStops: stopsForStation(station.id),
        }
      : null,
    kpis: {
      activeStations: stations.filter((s) => s.status === "ACTIVE").length,
      maintenance: stations.filter((s) => s.status === "MAINTENANCE").length,
      announcements: active.length,
      trainsRunning: simulated.length,
    },
  };
}
