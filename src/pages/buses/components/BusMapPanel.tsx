import { LazyMap } from "@/components/lazy-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BusMapPanel({ selectedRoute }: { selectedRoute: string | null }) {
  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-base">
          {selectedRoute ? `Tuyến ${selectedRoute} — trạm kết nối ga` : "Toàn bộ trạm buýt kết nối"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LazyMap height={600} highlightRoute={selectedRoute} />
      </CardContent>
    </Card>
  );
}
