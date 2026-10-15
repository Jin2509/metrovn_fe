import { hourlyFlow, stations } from "@/mocks/metro";
import type {
  PassengerFlowPoint,
  PassengerFlowTimeSlot,
} from "@/pages/passengerflow/passengerflow.types";

export function getPassengerFlowView(stationId: string, timeSlot: PassengerFlowTimeSlot) {
  const activeStations = stations.filter((station) => station.status === "ACTIVE");
  const factor =
    stationId === "ALL"
      ? 1
      : (activeStations.find((station) => station.id === stationId)?.dailyFlow ?? 0) /
        activeStations.reduce((total, station) => total + station.dailyFlow, 0);
  const data: PassengerFlowPoint[] = hourlyFlow
    .map((hourly) => ({ ...hourly, luot: Math.round(hourly.luot * factor) }))
    .filter((hourly) => {
      const hour = parseInt(hourly.hour);
      return timeSlot === "ALL" || (timeSlot === "AM" ? hour < 12 : hour >= 12);
    });
  const max = Math.max(...data.map((point) => point.luot));

  return {
    activeStations,
    data,
    max,
    total: data.reduce((sum, point) => sum + point.luot, 0).toLocaleString("vi-VN"),
    peakHour: data.find((point) => point.luot === max)?.hour ?? "—",
    peakVolume: max.toLocaleString("vi-VN"),
    sortedStations: [...activeStations].sort((first, second) => second.dailyFlow - first.dailyFlow),
  };
}
