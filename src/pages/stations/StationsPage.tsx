import { AppShell } from "@/components/app-shell";
import { StationDetailsPanel } from "@/pages/stations/components/StationDetailsPanel";
import { StationList } from "@/pages/stations/components/StationList";
import { useStations } from "@/pages/stations/hooks/useStations";

export function StationsPage() {
  const {
    query,
    setQuery,
    selectedStationId,
    selectStation,
    stationRows,
    selectedStation,
    connectedStops,
  } = useStations();

  return (
    <AppShell title="Quản lý ga" roles={["ADMIN"]}>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <StationList
          query={query}
          onQueryChange={setQuery}
          rows={stationRows}
          selectedStationId={selectedStationId}
          onSelectStation={selectStation}
        />
        <StationDetailsPanel
          station={selectedStation}
          stationId={selectedStationId}
          connectedStops={connectedStops}
          onSelectStation={selectStation}
        />
      </div>
    </AppShell>
  );
}
