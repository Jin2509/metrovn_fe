import { AppShell } from "@/components/app-shell";
import { AiRecommendationCard } from "@/pages/map/components/AiRecommendationCard";
import { MapCanvas } from "@/pages/map/components/MapCanvas";
import { MapLayersPanel } from "@/pages/map/components/MapLayersPanel";
import { StationDetailsPanel } from "@/pages/map/components/StationDetailsPanel";
import { useMap } from "@/pages/map/hooks/useMap";

export function MapPage() {
  const {
    lines,
    visibleLines,
    setLineVisibility,
    showBus,
    setShowBus,
    selectedStationId,
    selectStation,
    selectedStation,
    connectedStops,
  } = useMap();

  return (
    <AppShell title="Bản đồ hệ thống" roles={["ADMIN"]}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <MapCanvas
          visibleLines={visibleLines}
          showBus={showBus}
          selectedStationId={selectedStationId}
          onSelectStation={selectStation}
        />
        <div className="space-y-4">
          <MapLayersPanel
            lines={lines}
            visibleLines={visibleLines}
            onLineVisibilityChange={setLineVisibility}
            showBus={showBus}
            onShowBusChange={setShowBus}
          />
          <StationDetailsPanel station={selectedStation} connectedStops={connectedStops} />
          <AiRecommendationCard />
        </div>
      </div>
    </AppShell>
  );
}
