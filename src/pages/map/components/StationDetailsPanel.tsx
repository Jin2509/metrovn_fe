import { Bus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusStop, Station } from "@/mocks/metro";

export function StationDetailsPanel({
  station,
  connectedStops,
}: {
  station: Station | undefined;
  connectedStops: BusStop[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {station ? `Ga ${station.name}` : "Chọn một ga"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {station ? (
          <>
            <p className="text-muted-foreground">
              {station.status === "ACTIVE"
                ? `${station.dailyFlow.toLocaleString("vi-VN")} lượt/ngày`
                : "Đang quy hoạch"}
            </p>
            {connectedStops.map((stop) => (
              <div key={stop.id} className="rounded-lg bg-muted p-2">
                <p className="flex items-center gap-1 font-medium">
                  <Bus className="size-4" aria-hidden="true" />
                  {stop.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stop.walkMinutes} phút đi bộ · tuyến {stop.routes.join(", ")}
                </p>
              </div>
            ))}
          </>
        ) : (
          <p className="text-muted-foreground">
            Bấm vào ga trên bản đồ để xem chi tiết và trạm buýt kết nối.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
