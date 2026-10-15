import { useState } from "react";
import { lines, stations, stopsForStation } from "@/mocks/metro";

export function useMap() {
  const [visibleLines, setVisibleLines] = useState(["L1", "L2"]);
  const [showBus, setShowBus] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const selectedStation = stations.find((station) => station.id === selectedStationId);
  const connectedStops = selectedStation ? stopsForStation(selectedStation.id) : [];

  const setLineVisibility = (lineId: string, visible: boolean) => {
    setVisibleLines((currentLines) =>
      visible
        ? [...currentLines, lineId]
        : currentLines.filter((currentLine) => currentLine !== lineId),
    );
  };

  return {
    lines,
    visibleLines,
    setLineVisibility,
    showBus,
    setShowBus,
    selectedStationId,
    selectStation: setSelectedStationId,
    selectedStation,
    connectedStops,
  };
}
