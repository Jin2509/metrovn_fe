import { LazyMap } from "@/components/lazy-map";
import { Card, CardContent } from "@/components/ui/card";

export function MapCanvas({
  visibleLines,
  showBus,
  selectedStationId,
  onSelectStation,
}: {
  visibleLines: string[];
  showBus: boolean;
  selectedStationId: string | null;
  onSelectStation: (stationId: string | null) => void;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <LazyMap
          height={620}
          visibleLines={visibleLines}
          showBus={showBus}
          focusStationId={selectedStationId}
          onSelectStation={onSelectStation}
        />
      </CardContent>
    </Card>
  );
}
