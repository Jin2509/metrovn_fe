import { LazyMap } from "@/components/lazy-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BusStop, Station } from "@/mocks/metro";

export function StationDetailsPanel({
  station,
  stationId,
  connectedStops,
  onSelectStation,
}: {
  station: Station;
  stationId: string;
  connectedStops: BusStop[];
  onSelectStation: (stationId: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 text-lg font-semibold">Ga {station.name}</h2>
        <Tabs defaultValue="map">
          <TabsList>
            <TabsTrigger value="map">Vị trí</TabsTrigger>
            <TabsTrigger value="bus">Trạm xe buýt gần ga</TabsTrigger>
          </TabsList>
          <TabsContent value="map">
            <LazyMap height={360} focusStationId={stationId} onSelectStation={onSelectStation} />
          </TabsContent>
          <TabsContent value="bus" className="space-y-2">
            {connectedStops.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có trạm buýt kết nối.</p>
            )}
            {connectedStops.map((stop) => (
              <div key={stop.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{stop.name}</p>
                <p className="text-xs text-muted-foreground">Đi bộ ~{stop.walkMinutes} phút</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {stop.routes.map((route) => (
                    <Badge key={route} className="bg-bus text-primary-foreground">
                      {route}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
