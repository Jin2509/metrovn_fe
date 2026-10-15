import { useState } from "react";
import { lines, stations, stopsForStation } from "@/mocks/metro";
import type { StationListRow } from "@/pages/stations/stations.types";

export function useStations() {
  const [query, setQuery] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("S1-1");
  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(query.toLowerCase()),
  );
  const stationRows: StationListRow[] = filteredStations.map((station) => ({
    ...station,
    connectedBusStopCount: stopsForStation(station.id).length,
    lines: station.lineIds.map((lineId) => lines.find((line) => line.id === lineId)!),
  }));
  const selectedStation = stations.find((station) => station.id === selectedStationId)!;
  const connectedStops = stopsForStation(selectedStation.id);

  return {
    query,
    setQuery,
    selectedStationId,
    selectStation: setSelectedStationId,
    stationRows,
    selectedStation,
    connectedStops,
  };
}
