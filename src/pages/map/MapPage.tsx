import { Bus, Map as MapIcon } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { BusesPanel } from "@/pages/buses";
import { AiRecommendationCard } from "@/pages/map/components/AiRecommendationCard";
import { MapCanvas } from "@/pages/map/components/MapCanvas";
import { MapLayersPanel } from "@/pages/map/components/MapLayersPanel";
import { StationDetailsPanel } from "@/pages/map/components/StationDetailsPanel";
import { useMap } from "@/pages/map/hooks/useMap";

function NetworkMapPanel() {
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
  );
}

export function MapPage() {
  return (
    <AppShell title="Bản đồ & xe buýt">
      <PageTabs
        tabs={[
          {
            value: "network",
            label: "Bản đồ mạng lưới",
            icon: MapIcon,
            content: <NetworkMapPanel />,
          },
          { value: "buses", label: "Xe buýt kết nối", icon: Bus, content: <BusesPanel /> },
        ]}
      />
    </AppShell>
  );
}
