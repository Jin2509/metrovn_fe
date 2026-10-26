import { Building2, Route } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { LinesPanel } from "@/pages/lines";
import { StationDetailsPanel } from "@/pages/stations/components/StationDetailsPanel";
import { StationList } from "@/pages/stations/components/StationList";
import { useStations } from "@/pages/stations/hooks/useStations";

function StationListPanel() {
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
  );
}

export function StationsPage() {
  return (
    <AppShell title="Ga & tuyến">
      <PageTabs
        tabs={[
          {
            value: "stations",
            label: "Danh sách ga",
            icon: Building2,
            content: <StationListPanel />,
          },
          { value: "lines", label: "Tuyến & thứ tự ga", icon: Route, content: <LinesPanel /> },
        ]}
      />
    </AppShell>
  );
}
