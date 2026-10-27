import { useEffect, useMemo, useState } from "react";
import type { StationMarkerState } from "@/components/metro-map";
import { stationName } from "@/lib/network";
import { simulateTrains } from "@/lib/train-simulation";
import { announcementsStore } from "@/mocks/announcements";
import {
  lineStationRows,
  lineStationsStore,
  lines,
  stationsStore,
  stopsForStation,
} from "@/mocks/metro";
import { operationConfigsStore } from "@/mocks/operations";
import { activeForPassengers } from "@/pages/notifications/notifications.service";

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
  const [visibleLines, setVisibleLines] = useState(["L1", "L2"]);
  const [showBus, setShowBus] = useState(false);
  const [showTrains, setShowTrains] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const stations = stationsStore.use();
  const rows = lineStationsStore.use();
  const announcements = announcementsStore.use();
  const configs = operationConfigsStore.use();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), SIM_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const active = activeForPassengers(announcements, now);
  const config = configs.find((c) => c.lineId === "L1" && c.status === "ACTIVE");

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

  const trains = useMemo(
    () =>
      config && showTrains
        ? simulateTrains(config, lineStationRows("L1", rows), stations, now).map((t) => ({
            id: t.id,
            lat: t.lat,
            lng: t.lng,
            label: `Chuyến ${t.departedAt} → ${t.direction === "FORWARD" ? "Suối Tiên" : "Bến Thành"}${
              t.atStationId
                ? ` · đang dừng ga ${stationName(t.atStationId)}`
                : ` · sắp tới ga ${stationName(t.nextStationId)}`
            }`,
          }))
        : [],
    [config, showTrains, rows, stations, now],
  );

  const station = stations.find((s) => s.id === selectedStationId);

  return {
    lines,
    visibleLines,
    setLineVisibility: (lineId: string, visible: boolean) =>
      setVisibleLines((cur) => (visible ? [...cur, lineId] : cur.filter((l) => l !== lineId))),
    showBus,
    setShowBus,
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
      trainsRunning: config
        ? simulateTrains(config, lineStationRows("L1", rows), stations, now).length
        : 0,
    },
  };
}
